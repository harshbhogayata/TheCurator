import redis
import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import connection
from django.db.utils import Error as DatabaseError
from rest_framework import permissions, response, views


def _firebase_admin_status() -> str:
    project_id = (settings.FIREBASE_PROJECT_ID or "").strip()
    has_credentials = bool(
        (settings.FIREBASE_CREDENTIALS_JSON or "").strip()
        or (settings.FIREBASE_CREDENTIALS_PATH or "").strip()
    )
    if not project_id or not has_credentials:
        return "not_configured"

    try:
        from users.services.firebase import get_firebase_app

        get_firebase_app()
        return "ok"
    except ImproperlyConfigured:
        return "not_configured"
    except Exception:
        return "error"


def _email_delivery_status() -> str:
    from publicapi.email_delivery import email_delivery_configured

    return "ok" if email_delivery_configured() else "not_configured"


def _firebase_web_api_key_status() -> str:
    return "ok" if (settings.FIREBASE_WEB_API_KEY or "").strip() else "not_configured"


def _integration_status(name: str, *, configured: bool, ping=None) -> str:
    if not configured:
        return "not_configured"
    if ping is None:
        return "ok"
    try:
        return "ok" if ping() else "error"
    except Exception:
        return "error"


def _openai_status() -> str:
    return _integration_status(
        "openai",
        configured=bool((settings.OPENAI_API_KEY or "").strip()),
    )


def _pexels_status() -> str:
    return _integration_status(
        "pexels",
        configured=bool((settings.PEXELS_API_KEY or "").strip()),
    )


def _unsplash_status() -> str:
    return _integration_status(
        "unsplash",
        configured=bool((getattr(settings, "UNSPLASH_ACCESS_KEY", "") or "").strip()),
    )


def _kokoro_status() -> str:
    from mobileapi.audio_services import kokoro_speech_url

    endpoint = kokoro_speech_url()
    if not endpoint:
        return "not_configured"

    def ping():
        # Kokoro has no dedicated health route; a HEAD/GET on the base is enough.
        base = endpoint.rsplit("/audio/speech", 1)[0]
        probe = f"{base}/models" if base.endswith("/v1") else endpoint
        result = requests.get(probe, timeout=5)
        return result.status_code < 500

    return _integration_status("kokoro", configured=True, ping=ping)


def _currents_status() -> dict:
    from content_pipeline.services.currents import currents_budget_remaining

    configured = bool((getattr(settings, "CURRENTS_API_KEY", "") or "").strip())
    if not configured:
        return {"status": "not_configured", "budget_remaining": None}
    return {
        "status": "ok",
        "budget_remaining": currents_budget_remaining(),
    }


def _pipeline_status() -> str:
    return "enabled" if getattr(settings, "PIPELINE_ENABLED", True) else "disabled"


def _audio_storage_status() -> str:
    from mobileapi.audio_services import storage_backend

    backend = storage_backend()
    return backend if backend else "not_configured"


def _tts_status() -> dict:
    from mobileapi.audio_services import (
        audio_generation_configured,
        kokoro_speech_url,
        resolve_tts_provider,
    )

    provider = resolve_tts_provider()
    return {
        "provider": provider,
        "hosted_audio_ready": audio_generation_configured(),
        "kokoro_url_configured": bool(kokoro_speech_url()),
        "note": (
            "Set KOKORO_TTS_URL + TTS_PROVIDER=kokoro (or auto) on Railway. "
            "provider=none means production has no commercial TTS URL yet — "
            "Edge is dev-only and intentionally disabled in prod."
        ),
    }


class LivenessView(views.APIView):
    """Minimal probe for platform deploy healthchecks (no DB/Redis)."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return response.Response({"status": "ok"})


class HealthView(views.APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        database_status = "ok"
        redis_status = "ok"

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError:
            database_status = "error"

        if settings.CELERY_BROKER_URL:
            try:
                redis.Redis.from_url(settings.CELERY_BROKER_URL).ping()
            except redis.RedisError:
                redis_status = "error"
        else:
            redis_status = "not_configured"

        status_code = 200 if database_status == "ok" and redis_status != "error" else 503
        payload = {
            "status": "ok" if status_code == 200 else "degraded",
            "version": settings.APP_VERSION,
            "database": database_status,
            "redis": redis_status,
            "firebase": _firebase_admin_status(),
            "email_delivery": _email_delivery_status(),
            "firebase_web_api_key": _firebase_web_api_key_status(),
            "pipeline": _pipeline_status(),
            "audio_storage": _audio_storage_status(),
            "integrations": {
                "openai": _openai_status(),
                "pexels": _pexels_status(),
                "unsplash": _unsplash_status(),
                "kokoro": _kokoro_status(),
                "currents": _currents_status(),
            },
            "tts": _tts_status(),
        }
        return response.Response(payload, status=status_code)


class RootWelcomeView(views.APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        endpoints = {
            "health": request.build_absolute_uri("/health/"),
            "api_root": request.build_absolute_uri("/api/"),
            "articles": request.build_absolute_uri("/api/mobile/v1/articles"),
            "briefs": request.build_absolute_uri("/api/mobile/v1/briefs"),
            "categories": request.build_absolute_uri("/api/mobile/v1/categories"),
        }
        if settings.DEBUG:
            endpoints["admin"] = request.build_absolute_uri("/admin/")

        return response.Response({
            "name": "The Curator API Gateway",
            "status": "online",
            "message": "Premium AI-Curated Journalism Platform",
            "version": getattr(settings, "APP_VERSION", "1.0.0"),
            "endpoints": endpoints,
        })
