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
        self.assertContains(response, "confirmPasswordReset")

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
        self.assertContains(response, "applyActionCode")
