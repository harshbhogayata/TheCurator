from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from publicapi.models import LaunchNotifySignup


class LaunchNotifyViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_creates_signup(self):
        response = self.client.post(
            "/api/launch-notify",
            {"email": " Reader@Example.com "},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "registered")
        self.assertEqual(response.data["email"], "reader@example.com")
        self.assertTrue(LaunchNotifySignup.objects.filter(email="reader@example.com").exists())

    def test_duplicate_signup_is_idempotent(self):
        LaunchNotifySignup.objects.create(email="reader@example.com")

        response = self.client.post(
            "/api/launch-notify",
            {"email": "reader@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "already_registered")
        self.assertEqual(LaunchNotifySignup.objects.count(), 1)

    def test_rejects_invalid_email(self):
        response = self.client.post(
            "/api/launch-notify",
            {"email": "not-an-email"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(LaunchNotifySignup.objects.count(), 0)

    @override_settings(
        LAUNCH_NOTIFY_FORWARD_ENABLED=True,
        LAUNCH_NOTIFY_FORWARD_EMAIL="harsh@thecuratorgroup.org",
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_forwards_new_signup_to_founder(self):
        response = self.client.post(
            "/api/launch-notify",
            {"email": "waitlist@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["harsh@thecuratorgroup.org"])
        self.assertIn("waitlist@example.com", mail.outbox[0].body)

    @override_settings(
        LAUNCH_NOTIFY_FORWARD_ENABLED=True,
        LAUNCH_NOTIFY_FORWARD_EMAIL="harsh@thecuratorgroup.org",
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_does_not_forward_duplicate_signup(self):
        LaunchNotifySignup.objects.create(email="waitlist@example.com")

        response = self.client.post(
            "/api/launch-notify",
            {"email": "waitlist@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(LAUNCH_NOTIFY_FORWARD_ENABLED=False)
    @patch("publicapi.launch_notify.send_mail")
    def test_skips_forward_when_disabled(self, send_mail_mock):
        response = self.client.post(
            "/api/launch-notify",
            {"email": "waitlist@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        send_mail_mock.assert_not_called()
