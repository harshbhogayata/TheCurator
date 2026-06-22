from django.test import TestCase, override_settings

from users.auth_page_urls import mobile_reset_password_page_url, mobile_verify_email_page_url
from users.services.password_reset_email import build_click_to_reset_url


class AuthPageUrlTests(TestCase):
    @override_settings(
        API_PUBLIC_BASE_URL="https://thecurator-production-1b47.up.railway.app",
        WEB_BASE_URL="https://thecuratorgroup.org",
    )
    def test_reset_password_prefers_api_host(self):
        self.assertEqual(
            mobile_reset_password_page_url(),
            "https://thecurator-production-1b47.up.railway.app/m/reset-password",
        )

    @override_settings(
        API_PUBLIC_BASE_URL="https://thecurator-production-1b47.up.railway.app",
        WEB_BASE_URL="https://thecuratorgroup.org",
    )
    def test_verify_email_prefers_api_host(self):
        self.assertEqual(
            mobile_verify_email_page_url(),
            "https://thecurator-production-1b47.up.railway.app/m/verify-email",
        )


class PasswordResetEmailUrlTests(TestCase):
    @override_settings(
        API_PUBLIC_BASE_URL="https://thecurator-production-1b47.up.railway.app",
        WEB_BASE_URL="https://thecuratorgroup.org",
    )
    def test_rewrites_firebase_handler_to_api_reset_page(self):
        admin_link = (
            "https://thecuratorin.firebaseapp.com/__/auth/action"
            "?mode=resetPassword&oobCode=abc123&apiKey=key456&lang=en"
            "&continueUrl=https%3A%2F%2Fthecurator-production-1b47.up.railway.app%2Fm%2Freset-password%3Fstatus%3Ddone"
        )
        url = build_click_to_reset_url(admin_link)
        self.assertTrue(
            url.startswith("https://thecurator-production-1b47.up.railway.app/m/reset-password?")
        )
        self.assertIn("mode=resetPassword", url)
        self.assertIn("oobCode=abc123", url)
        self.assertIn("apiKey=key456", url)

    def test_rejects_link_without_oob_code(self):
        with self.assertRaises(ValueError):
            build_click_to_reset_url("https://thecuratorin.firebaseapp.com/__/auth/action?mode=resetPassword")
