import redis
from django.conf import settings
from django.db import connection
from django.db.utils import Error as DatabaseError
from rest_framework import permissions, response, views


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
