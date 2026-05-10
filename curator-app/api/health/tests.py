from unittest.mock import MagicMock, patch

from django.test import TestCase
import redis


class HealthViewTests(TestCase):
    @patch("health.views.redis.Redis.from_url")
    @patch("health.views.connection.cursor")
    def test_health_reports_ok_when_database_and_redis_are_available(self, mock_cursor, mock_redis_from_url):
        cursor_context = MagicMock()
        mock_cursor.return_value.__enter__.return_value = cursor_context
        mock_redis_from_url.return_value.ping.return_value = True

        response = self.client.get("/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
        self.assertEqual(response.json()["database"], "ok")
        self.assertEqual(response.json()["redis"], "ok")
        self.assertIn("version", response.json())

    @patch("health.views.redis.Redis.from_url")
    @patch("health.views.connection.cursor")
    def test_health_reports_degraded_when_redis_is_unavailable(self, mock_cursor, mock_redis_from_url):
        cursor_context = MagicMock()
        mock_cursor.return_value.__enter__.return_value = cursor_context
        mock_redis_from_url.return_value.ping.side_effect = redis.RedisError("redis down")

        response = self.client.get("/health/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "degraded")
        self.assertEqual(response.json()["database"], "ok")
        self.assertEqual(response.json()["redis"], "error")
