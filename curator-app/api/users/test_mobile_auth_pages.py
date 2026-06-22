from unittest.mock import patch

from django.test import TestCase, override_settings
from django.test.client import Client


class MobileAuthPageTests(TestCase):
    def setUp(self):
        self.client = Client()

    @override_settings(
        FIREBASE_WEB_API_KEY="test-key",
        FIREBASE_WEB_AUTH_DOMAIN="thecuratorin.firebaseapp.com",
        FIREBASE_PROJECT_ID="thecuratorin",
        FIREBASE_WEB_APP_ID="test-app",
    )
    def test_reset_password_page_renders(self):
        response = self.client.get("/m/reset-password?mode=resetPassword&oobCode=abc&apiKey=key")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Reset your password")
        self.assertContains(response, "/m/reset-password/confirm")

    @override_settings(
        FIREBASE_WEB_API_KEY="test-key",
        FIREBASE_WEB_AUTH_DOMAIN="thecuratorin.firebaseapp.com",
        FIREBASE_PROJECT_ID="thecuratorin",
        FIREBASE_WEB_APP_ID="test-app",
    )
    def test_verify_email_page_renders(self):
        response = self.client.get("/m/verify-email?mode=verifyEmail&oobCode=abc&apiKey=key")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Verify your email")
        self.assertContains(response, "/m/verify-email/confirm")

    @override_settings(FIREBASE_WEB_API_KEY="test-key")
    @patch("users.mobile_auth_pages.confirm_password_reset")
    def test_reset_password_confirm_endpoint(self, mock_confirm):
        mock_confirm.return_value = type("Result", (), {"email": "user@example.com"})()
        response = self.client.post(
            "/m/reset-password/confirm",
            data='{"oobCode":"abc","password":"newpass123"}',
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["detail"], "Password updated.")
