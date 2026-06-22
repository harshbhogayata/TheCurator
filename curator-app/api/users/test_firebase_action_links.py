from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from firebase_admin.auth import UserNotFoundError

from users.services.firebase_action_links import (
    generate_email_verification_admin_link,
    generate_password_reset_admin_link,
)
from users.services.password_reset_email import send_password_reset_email


class FirebaseActionLinkTests(TestCase):
    @patch("users.services.firebase_action_links.firebase_auth.generate_password_reset_link")
    @override_settings(
        WEB_BASE_URL="https://thecuratorgroup.org",
        FIREBASE_WEB_AUTH_DOMAIN="thecuratorin.firebaseapp.com",
        FIREBASE_PROJECT_ID="thecuratorin",
    )
    def test_password_reset_falls_back_when_marketing_continue_url_rejected(self, mock_generate):
        mock_generate.side_effect = [
            Exception("UNAUTHORIZED_CONTINUE_URI"),
            "https://thecuratorin.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=abc",
        ]

        link = generate_password_reset_admin_link("user@example.com")

        self.assertIn("oobCode=abc", link)
        self.assertEqual(mock_generate.call_count, 2)
        first_settings = mock_generate.call_args_list[0].args[1]
        self.assertEqual(
            first_settings.url,
            "https://thecuratorgroup.org/reset-password?status=done",
        )

    @patch("users.services.firebase_action_links.firebase_auth.generate_password_reset_link")
    @override_settings(WEB_BASE_URL="", FIREBASE_PROJECT_ID="thecuratorin")
    def test_password_reset_uses_default_link_when_continue_url_fails(self, mock_generate):
        mock_generate.side_effect = [
            Exception("bad continue"),
            "https://thecuratorin.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=xyz",
        ]

        link = generate_password_reset_admin_link("user@example.com")

        self.assertIn("oobCode=xyz", link)
        self.assertEqual(mock_generate.call_count, 2)
        self.assertEqual(mock_generate.call_args_list[1].args, ("user@example.com",))

    @patch("users.services.firebase_action_links.firebase_auth.generate_password_reset_link")
    def test_password_reset_propagates_user_not_found(self, mock_generate):
        mock_generate.side_effect = UserNotFoundError("missing")

        with self.assertRaises(UserNotFoundError):
            generate_password_reset_admin_link("missing@example.com")

    @patch("users.services.firebase_action_links.firebase_auth.generate_email_verification_link")
    @override_settings(WEB_BASE_URL="https://thecuratorgroup.org")
    def test_verification_link_uses_marketing_continue_url_first(self, mock_generate):
        mock_generate.return_value = (
            "https://thecuratorin.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=abc"
        )

        link = generate_email_verification_admin_link("user@example.com")

        self.assertIn("oobCode=abc", link)
        settings_obj = mock_generate.call_args.args[1]
        self.assertEqual(
            settings_obj.url,
            "https://thecuratorgroup.org/verify-email?status=done",
        )


class SendPasswordResetEmailTests(TestCase):
    @override_settings(RESEND_API_KEY="re_test", DEBUG=False)
    @patch("users.services.password_reset_email.deliver_email", return_value=True)
    @patch("users.services.password_reset_email.generate_password_reset_admin_link")
    def test_send_password_reset_email_success(self, mock_generate, mock_deliver):
        mock_generate.return_value = (
            "https://thecuratorin.firebaseapp.com/__/auth/action"
            "?mode=resetPassword&oobCode=abc123&apiKey=key456"
        )

        sent = send_password_reset_email(email="user@example.com")

        self.assertTrue(sent)
        mock_deliver.assert_called_once()
        action_url = mock_deliver.call_args.kwargs.get("html_message") or ""
        self.assertIn("/m/reset-password", action_url)
        self.assertIn("oobCode=abc123", action_url)

    @override_settings(RESEND_API_KEY="", DEBUG=False, EMAIL_HOST="")
    def test_send_password_reset_email_without_delivery_config(self):
        sent = send_password_reset_email(email="user@example.com")
        self.assertFalse(sent)

    @override_settings(RESEND_API_KEY="re_test", DEBUG=False)
    @patch("users.services.password_reset_email.generate_password_reset_admin_link")
    def test_send_password_reset_email_unknown_user_returns_success(self, mock_generate):
        mock_generate.side_effect = UserNotFoundError("missing")

        sent = send_password_reset_email(email="missing@example.com")

        self.assertTrue(sent)
