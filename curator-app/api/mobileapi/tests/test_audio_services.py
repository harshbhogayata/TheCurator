from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from mobileapi.audio_services import (
    audio_generation_configured,
    kokoro_speech_url,
    resolve_tts_provider,
    synthesize_kokoro,
)


class TtsProviderTests(SimpleTestCase):
    @override_settings(DEBUG=True, TTS_PROVIDER="auto", KOKORO_TTS_URL="", OPENAI_API_KEY="")
    def test_auto_uses_edge_in_debug(self):
        self.assertEqual(resolve_tts_provider(), "edge")

    @override_settings(
        DEBUG=False,
        TTS_PROVIDER="auto",
        KOKORO_TTS_URL="http://kokoro:8880/v1",
        OPENAI_API_KEY="",
    )
    def test_auto_prefers_kokoro_in_production(self):
        self.assertEqual(resolve_tts_provider(), "kokoro")

    @override_settings(DEBUG=False, TTS_PROVIDER="auto", KOKORO_TTS_URL="", OPENAI_API_KEY="")
    def test_auto_disables_hosted_audio_without_commercial_tts(self):
        self.assertEqual(resolve_tts_provider(), "none")
        self.assertFalse(audio_generation_configured())

    @override_settings(KOKORO_TTS_URL="http://127.0.0.1:8880/v1")
    def test_kokoro_speech_url_normalization(self):
        self.assertEqual(
            kokoro_speech_url(),
            "http://127.0.0.1:8880/v1/audio/speech",
        )

    @override_settings(KOKORO_TTS_URL="http://127.0.0.1:8880/v1/audio/speech")
    @patch("mobileapi.audio_services.requests.post")
    def test_synthesize_kokoro_posts_openai_compatible_payload(self, mock_post):
        mock_post.return_value = MagicMock(status_code=200, content=b"mp3-bytes")

        audio = synthesize_kokoro("Hello world", voice="af_heart")

        self.assertEqual(audio, b"mp3-bytes")
        mock_post.assert_called_once()
        payload = mock_post.call_args.kwargs["json"]
        self.assertEqual(payload["input"], "Hello world")
        self.assertEqual(payload["voice"], "af_heart")
        self.assertEqual(payload["response_format"], "mp3")
