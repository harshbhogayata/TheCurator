from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings

from users.services.firebase_identity import (
    FirebaseIdentityError,
    apply_email_verification,
    confirm_password_reset,
)


class FirebaseIdentityServiceTests(TestCase):
    @override_settings(FIREBASE_WEB_API_KEY="test-web-key")
    @patch("users.services.firebase_identity.requests.post")
    def test_confirm_password_reset_success(self, mock_post):
        mock_post.return_value = MagicMock(ok=True, json=lambda: {"email": "user@example.com"})

        result = confirm_password_reset(oob_code="abc", new_password="newpass123")

        self.assertEqual(result.email, "user@example.com")
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args.kwargs
        self.assertEqual(call_kwargs["json"], {"oobCode": "abc", "newPassword": "newpass123"})
        self.assertEqual(call_kwargs["params"]["key"], "test-web-key")

    @override_settings(FIREBASE_WEB_API_KEY="test-web-key")
    @patch("users.services.firebase_identity.requests.post")
    def test_confirm_password_reset_invalid_code(self, mock_post):
        mock_post.return_value = MagicMock(
            ok=False,
            json=lambda: {"error": {"message": "INVALID_OOB_CODE"}},
        )

        with self.assertRaises(FirebaseIdentityError) as ctx:
            confirm_password_reset(oob_code="bad", new_password="newpass123")

        self.assertEqual(ctx.exception.code, "invalid_action_code")

    @override_settings(FIREBASE_WEB_API_KEY="test-web-key")
    @patch("users.services.firebase_identity.requests.post")
    def test_apply_email_verification_success(self, mock_post):
        mock_post.return_value = MagicMock(ok=True, json=lambda: {"email": "user@example.com"})

        email = apply_email_verification(oob_code="abc")

        self.assertEqual(email, "user@example.com")
