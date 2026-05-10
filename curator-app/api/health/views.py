import redis
from django.conf import settings
from django.db import connection
from django.db.utils import Error as DatabaseError
from rest_framework import permissions, response, views


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

        try:
            redis.Redis.from_url(settings.CELERY_BROKER_URL).ping()
        except redis.RedisError:
            redis_status = "error"

        status_code = 200 if database_status == "ok" and redis_status == "ok" else 503
        payload = {
            "status": "ok" if status_code == 200 else "degraded",
            "version": settings.APP_VERSION,
            "database": database_status,
            "redis": redis_status,
        }
        return response.Response(payload, status=status_code)
