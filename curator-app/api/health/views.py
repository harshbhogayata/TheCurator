import redis
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
