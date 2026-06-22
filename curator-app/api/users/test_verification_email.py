from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from users.models import User
from users.services.verification_email import build_click_to_verify_url


class VerificationEmailUrlTests(TestCase):
  @override_settings(WEB_BASE_URL="https://thecuratorgroup.org")
  def test_rewrites_firebase_handler_to_click_to_verify_page(self):
    admin_link = (
      "https://thecuratorin.firebaseapp.com/__/auth/action"
      "?mode=verifyEmail&oobCode=abc123&apiKey=key456&lang=en"
      "&continueUrl=https%3A%2F%2Fthecuratorgroup.org%2Fverify-email%3Fstatus%3Ddone"
    )
    url = build_click_to_verify_url(admin_link)
    self.assertTrue(url.startswith("https://thecuratorgroup.org/verify-email?"))
    self.assertIn("mode=verifyEmail", url)
    self.assertIn("oobCode=abc123", url)
    self.assertIn("apiKey=key456", url)

  def test_rejects_link_without_oob_code(self):
    with self.assertRaises(ValueError):
      build_click_to_verify_url("https://thecuratorin.firebaseapp.com/__/auth/action?mode=verifyEmail")


class VerificationEmailViewTests(TestCase):
  def setUp(self):
    self.factory = APIRequestFactory()
    self.user = User.objects.create_user(
      email="reader@example.com",
      password="secret123",
      firebase_uid="firebase-reader-123",
    )

  @patch("users.views.send_verification_email", return_value=True)
  def test_sends_verification_email(self, send_mock):
    from users.views import VerificationEmailView

    request = self.factory.post("/api/mobile/v1/auth/verification-email")
    force_authenticate(request, user=self.user)
    response = VerificationEmailView.as_view()(request)
    self.assertEqual(response.status_code, 204)
    send_mock.assert_called_once_with(email="reader@example.com")

  @patch("users.views.send_verification_email", return_value=True)
  def test_skips_when_already_verified(self, send_mock):
    from users.views import VerificationEmailView

    self.user.email_verified_at = timezone.now()
    self.user.save(update_fields=["email_verified_at"])
    request = self.factory.post("/api/mobile/v1/auth/verification-email")
    force_authenticate(request, user=self.user)
    response = VerificationEmailView.as_view()(request)
    self.assertEqual(response.status_code, 204)
    send_mock.assert_not_called()
