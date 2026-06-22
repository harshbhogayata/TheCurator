from unittest.mock import patch

from django.test import TestCase, override_settings

from users.services.password_reset_email import build_click_to_reset_url


class PasswordResetEmailUrlTests(TestCase):
    @override_settings(WEB_BASE_URL="https://thecuratorgroup.org")
    def test_rewrites_firebase_handler_to_click_to_reset_page(self):
        admin_link = (
            "https://thecuratorin.firebaseapp.com/__/auth/action"
            "?mode=resetPassword&oobCode=abc123&apiKey=key456&lang=en"
            "&continueUrl=https%3A%2F%2Fthecuratorgroup.org%2Freset-password.html%3Fstatus%3Ddone"
        )
        url = build_click_to_reset_url(admin_link)
        self.assertTrue(url.startswith("https://thecuratorgroup.org/reset-password?"))
        self.assertIn("mode=resetPassword", url)
        self.assertIn("oobCode=abc123", url)
        self.assertIn("apiKey=key456", url)

    def test_rejects_link_without_oob_code(self):
        with self.assertRaises(ValueError):
            build_click_to_reset_url("https://thecuratorin.firebaseapp.com/__/auth/action?mode=resetPassword")
