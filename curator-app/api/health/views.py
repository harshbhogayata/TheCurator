from django.db import connection
from rest_framework import permissions, response, views


class HealthView(views.APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        return response.Response({"status": "ok", "database": "ok"})
