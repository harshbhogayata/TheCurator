"""Upload a tiny test MP3 to configured audio storage and print the public URL."""

import logging

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from mobileapi.audio_services import (
    audio_generation_configured,
    resolve_tts_provider,
    storage_backend,
    synthesize_chunk,
    upload_audio_bytes,
)

logger = logging.getLogger(__name__)

TEST_KEY = "healthcheck/tts-storage-test.mp3"
TEST_PHRASE = "Curator audio storage is configured correctly."


class Command(BaseCommand):
    help = "Verify Edge/OpenAI TTS + S3/R2/local audio storage by uploading a test MP3."

    def handle(self, *args, **options):
        backend = storage_backend()
        if not backend:
            raise CommandError(
                "No audio storage backend. Set API_PUBLIC_BASE_URL (local) or AUDIO_S3_* (R2)."
            )

        provider = resolve_tts_provider()
        self.stdout.write(f"TTS provider: {provider}")
        self.stdout.write(f"Storage backend: {backend}")

        if provider == "openai" and not getattr(settings, "OPENAI_API_KEY", ""):
            raise CommandError("TTS_PROVIDER=openai but OPENAI_API_KEY is missing.")

        try:
            audio_bytes = synthesize_chunk(TEST_PHRASE, provider=provider)
        except Exception as exc:  # noqa: BLE001
            raise CommandError(f"TTS synthesis failed: {exc}") from exc

        if len(audio_bytes) < 100:
            raise CommandError("TTS returned unexpectedly small audio payload.")

        try:
            url = upload_audio_bytes(TEST_KEY, audio_bytes)
        except Exception as exc:  # noqa: BLE001
            raise CommandError(f"Upload failed: {exc}") from exc

        self.stdout.write(self.style.SUCCESS(f"Upload OK ({len(audio_bytes)} bytes)"))
        self.stdout.write(f"Public URL: {url}")
        self.stdout.write(
            self.style.WARNING(
                "Open the URL in a browser — you should hear a short test phrase. "
                "Delete healthcheck/tts-storage-test.mp3 from the bucket when done."
            )
        )

        if not audio_generation_configured():
            self.stdout.write(
                self.style.WARNING(
                    "Note: audio_generation_configured() is false — check OPENAI key if using openai."
                )
            )
