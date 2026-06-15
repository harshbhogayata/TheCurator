"""Article narration: TTS synthesis + upload to S3-compatible or local storage.

Providers:
- ``edge`` — Microsoft Edge neural voices via edge-tts (free, no API key).
- ``openai`` — OpenAI speech API (paid).

When no hosted MP3 is available, mobile clients fall back to on-device narration
using ``narrationText`` returned from the audio API.
"""

import asyncio
import io
import logging
from pathlib import Path

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
# OpenAI's speech endpoint accepts up to 4096 input characters per request;
# we chunk below that with margin and concatenate the resulting mp3 segments.
MAX_TTS_CHARS = 3800
# expo-speech / device TTS works best with shorter passages.
MAX_DEVICE_NARRATION_CHARS = 12_000

S3_STORAGE_SETTINGS = (
    "AUDIO_S3_ENDPOINT_URL",
    "AUDIO_S3_BUCKET",
    "AUDIO_S3_ACCESS_KEY_ID",
    "AUDIO_S3_SECRET_ACCESS_KEY",
    "AUDIO_PUBLIC_BASE_URL",
)


class AudioGenerationError(RuntimeError):
    pass


def chunk_text(text, limit=MAX_TTS_CHARS):
    text = (text or "").strip()
    if not text:
        return []

    paragraphs = [paragraph.strip() for paragraph in text.split("\n") if paragraph.strip()]
    chunks = []
    current = ""

    for paragraph in paragraphs:
        while len(paragraph) > limit:
            head, paragraph = paragraph[:limit], paragraph[limit:]
            if current:
                chunks.append(current)
                current = ""
            chunks.append(head)

        if not current:
            current = paragraph
        elif len(current) + 1 + len(paragraph) <= limit:
            current = f"{current}\n{paragraph}"
        else:
            chunks.append(current)
            current = paragraph

    if current:
        chunks.append(current)

    return chunks


def narration_text_for_article(article):
    """Plain text suitable for device TTS when no hosted MP3 exists."""
    title = (article.title or "").strip()
    body = (article.content or article.excerpt or "").strip()
    combined = f"{title}. {body}" if title and body else title or body
    if len(combined) > MAX_DEVICE_NARRATION_CHARS:
        combined = combined[:MAX_DEVICE_NARRATION_CHARS].rsplit(" ", 1)[0] + "…"
    return combined


def narration_text_for_brief(brief):
    """Plain text suitable for device TTS when no hosted MP3 exists."""
    title = (brief.title or "").strip()
    summary = (brief.summary or "").strip()
    combined = f"{title}. {summary}" if title and summary else title or summary
    if len(combined) > MAX_DEVICE_NARRATION_CHARS:
        combined = combined[:MAX_DEVICE_NARRATION_CHARS].rsplit(" ", 1)[0] + "…"
    return combined


def resolve_tts_provider():
    configured = getattr(settings, "TTS_PROVIDER", "auto").lower()
    if configured == "openai":
        if getattr(settings, "OPENAI_API_KEY", ""):
            return "openai"
        logger.warning("TTS_PROVIDER=openai but OPENAI_API_KEY is missing; using edge.")
        return "edge"
    if configured == "edge":
        return "edge"
    # auto — prefer free Edge neural voices; OpenAI is opt-in via TTS_PROVIDER=openai.
    return "edge"


def storage_backend():
    configured = getattr(settings, "AUDIO_STORAGE_BACKEND", "auto").lower()
    if configured in {"s3", "local"}:
        return configured
    if all(getattr(settings, name, "") for name in S3_STORAGE_SETTINGS):
        return "s3"
    if public_audio_base_url():
        return "local"
    return ""


def audio_generation_configured():
    if not storage_backend():
        return False
    provider = resolve_tts_provider()
    if provider == "openai":
        return bool(getattr(settings, "OPENAI_API_KEY", ""))
    return True


# Backwards-compatible alias used across views/commands.
audio_storage_configured = audio_generation_configured


def synthesize_openai(text, *, model, voice, api_key):
    response = requests.post(
        OPENAI_TTS_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "voice": voice,
            "input": text,
            "response_format": "mp3",
        },
        timeout=120,
    )
    if response.status_code != 200:
        raise AudioGenerationError(
            f"OpenAI TTS request failed ({response.status_code}): {response.text[:300]}"
        )
    return response.content


async def _synthesize_edge_async(text, *, voice):
    import edge_tts

    communicate = edge_tts.Communicate(text, voice)
    audio = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
    if not audio:
        raise AudioGenerationError("Edge TTS returned no audio data.")
    return bytes(audio)


def synthesize_edge(text, *, voice):
    try:
        return asyncio.run(_synthesize_edge_async(text, voice=voice))
    except RuntimeError:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(_synthesize_edge_async(text, voice=voice))
        finally:
            loop.close()


def synthesize_chunk(text, *, provider, model=None, voice=None, api_key=None):
    if provider == "openai":
        return synthesize_openai(
            text,
            model=model or getattr(settings, "OPENAI_TTS_MODEL", "gpt-4o-mini-tts"),
            voice=voice or getattr(settings, "OPENAI_TTS_VOICE", "alloy"),
            api_key=api_key or getattr(settings, "OPENAI_API_KEY", ""),
        )
    return synthesize_edge(
        text,
        voice=voice or getattr(settings, "EDGE_TTS_VOICE", "en-US-JennyNeural"),
    )


def mp3_duration_seconds(mp3_bytes):
    try:
        from mutagen.mp3 import MP3

        audio = MP3(io.BytesIO(mp3_bytes))
        return int(round(audio.info.length))
    except Exception:  # noqa: BLE001 - duration is best-effort metadata
        logger.warning("Could not determine mp3 duration; leaving audio_duration_sec unset.")
        return None


def build_storage_client():
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=settings.AUDIO_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AUDIO_S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AUDIO_S3_SECRET_ACCESS_KEY,
        region_name=getattr(settings, "AUDIO_S3_REGION", "auto"),
    )


def local_audio_root():
    return Path(getattr(settings, "AUDIO_LOCAL_ROOT", settings.BASE_DIR / "media" / "audio"))


def public_audio_base_url():
    return (
        getattr(settings, "AUDIO_PUBLIC_BASE_URL", "").strip()
        or getattr(settings, "API_PUBLIC_BASE_URL", "").strip()
    )


def upload_audio_bytes(storage_key, audio_bytes):
    backend = storage_backend()
    if backend == "s3":
        storage_client = build_storage_client()
        storage_client.put_object(
            Bucket=settings.AUDIO_S3_BUCKET,
            Key=storage_key,
            Body=audio_bytes,
            ContentType="audio/mpeg",
            CacheControl="public, max-age=31536000, immutable",
        )
        base_url = public_audio_base_url().rstrip("/")
        return f"{base_url}/{storage_key}"

    root = local_audio_root()
    destination = root / storage_key
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(audio_bytes)
    base_url = public_audio_base_url().rstrip("/")
    media_prefix = getattr(settings, "AUDIO_LOCAL_URL_PREFIX", "/api/mobile/v1/media/audio").rstrip("/")
    return f"{base_url}{media_prefix}/{storage_key}"


def generate_audio_for_text(text, *, storage_key, model=None, voice=None):
    """Synthesize narration for `text`, upload it, and return (url, duration_sec)."""
    if not audio_generation_configured():
        raise AudioGenerationError("TTS/storage is not configured.")

    provider = resolve_tts_provider()
    if provider == "openai" and not getattr(settings, "OPENAI_API_KEY", ""):
        raise AudioGenerationError("OPENAI_API_KEY is not configured.")

    chunks = chunk_text(text)
    if not chunks:
        raise AudioGenerationError("No content to narrate.")

    audio = bytearray()
    for chunk in chunks:
        audio.extend(
            synthesize_chunk(
                chunk,
                provider=provider,
                model=model,
                voice=voice,
            )
        )
    audio_bytes = bytes(audio)
    return upload_audio_bytes(storage_key, audio_bytes), mp3_duration_seconds(audio_bytes)


def generate_audio_for_article(article, *, model=None, voice=None):
    """Generate narration for an Article and persist audio fields."""
    url, duration = generate_audio_for_text(
        article.content,
        storage_key=f"article-audio/{article.id}.mp3",
        model=model,
        voice=voice,
    )
    article.audio_url = url
    article.audio_duration_sec = duration
    article.save(update_fields=["audio_url", "audio_duration_sec", "updated_at"])
    return article


def generate_audio_for_brief(brief, *, model=None, voice=None):
    """Generate narration for a Brief and persist its audio fields."""
    narration = narration_text_for_brief(brief)
    url, duration = generate_audio_for_text(
        narration,
        storage_key=f"brief-audio/{brief.id}.mp3",
        model=model,
        voice=voice,
    )
    brief.audio_url = url
    if hasattr(brief, "audio_duration_sec"):
        brief.audio_duration_sec = duration
        brief.save(update_fields=["audio_url", "audio_duration_sec", "updated_at"])
    else:
        brief.save(update_fields=["audio_url", "updated_at"])
    return brief


def ensure_article_audio(article, *, model=None, voice=None):
    """Return article with audio_url populated, generating synchronously when configured."""
    if article.audio_url:
        return article
    if not article.content.strip() or not audio_generation_configured():
        return article
    return generate_audio_for_article(article, model=model, voice=voice)


def ensure_brief_audio(brief, *, model=None, voice=None):
    """Return brief with audio_url populated, generating synchronously when configured."""
    if brief.audio_url:
        return brief
    if not brief.summary.strip() or not audio_generation_configured():
        return brief
    return generate_audio_for_brief(brief, model=model, voice=voice)
