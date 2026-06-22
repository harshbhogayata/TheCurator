from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory

from users.views import PasswordResetRequestView


class PasswordResetRequestViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = PasswordResetRequestView.as_view()

    @override_settings(RESEND_API_KEY="re_test", DEBUG=False)
    @patch("users.views.send_password_reset_email", return_value=True)
    def test_password_reset_returns_success(self, mock_send):
        request = self.factory.post(
            "/api/mobile/v1/auth/password-reset",
            {"email": "user@example.com"},
            format="json",
        )
        response = self.view(request)
        self.assertEqual(response.status_code, 200)
        mock_send.assert_called_once_with(email="user@example.com")

    @override_settings(RESEND_API_KEY="re_test", DEBUG=False)
    @patch("users.views.send_password_reset_email", return_value=False)
    def test_password_reset_email_unavailable(self, mock_send):
        request = self.factory.post(
            "/api/mobile/v1/auth/password-reset",
            {"email": "user@example.com"},
            format="json",
        )
        response = self.view(request)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "email_unavailable")

    @override_settings(RESEND_API_KEY="re_test", DEBUG=False)
    @patch("users.views.send_password_reset_email", side_effect=ValueError("bad link"))
    def test_password_reset_service_unavailable(self, mock_send):
        request = self.factory.post(
            "/api/mobile/v1/auth/password-reset",
            {"email": "user@example.com"},
            format="json",
        )
        response = self.view(request)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "service_unavailable")
