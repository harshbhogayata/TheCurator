"""Article narration: OpenAI TTS synthesis + upload to S3-compatible storage.

Shared by the `generate_article_audio` management command and the content
pipeline's post-publish Celery task.
"""

import io
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
# OpenAI's speech endpoint accepts up to 4096 input characters per request;
# we chunk below that with margin and concatenate the resulting mp3 segments.
MAX_TTS_CHARS = 3800

REQUIRED_STORAGE_SETTINGS = (
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
        # Hard-split any single paragraph that is longer than the limit.
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


def audio_storage_configured():
    if not getattr(settings, "OPENAI_API_KEY", ""):
        return False
    return all(getattr(settings, name, "") for name in REQUIRED_STORAGE_SETTINGS)


def generate_audio_for_text(text, *, storage_key, model=None, voice=None):
    """Synthesize narration for `text`, upload it, and return (url, duration_sec)."""
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        raise AudioGenerationError("OPENAI_API_KEY is not configured.")
    missing = [name for name in REQUIRED_STORAGE_SETTINGS if not getattr(settings, name, "")]
    if missing:
        raise AudioGenerationError(f"Missing storage configuration: {', '.join(missing)}")

    model = model or getattr(settings, "OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
    voice = voice or getattr(settings, "OPENAI_TTS_VOICE", "alloy")

    chunks = chunk_text(text)
    if not chunks:
        raise AudioGenerationError("No content to narrate.")

    audio = bytearray()
    for chunk in chunks:
        audio.extend(synthesize_openai(chunk, model=model, voice=voice, api_key=api_key))
    audio_bytes = bytes(audio)

    storage_client = build_storage_client()
    storage_client.put_object(
        Bucket=settings.AUDIO_S3_BUCKET,
        Key=storage_key,
        Body=audio_bytes,
        ContentType="audio/mpeg",
        CacheControl="public, max-age=31536000, immutable",
    )

    base_url = settings.AUDIO_PUBLIC_BASE_URL.rstrip("/")
    return f"{base_url}/{storage_key}", mp3_duration_seconds(audio_bytes)


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
    """Generate narration for a Brief and persist its audio_url."""
    url, _duration = generate_audio_for_text(
        brief.summary,
        storage_key=f"brief-audio/{brief.id}.mp3",
        model=model,
        voice=voice,
    )
    brief.audio_url = url
    brief.save(update_fields=["audio_url", "updated_at"])
    return brief
