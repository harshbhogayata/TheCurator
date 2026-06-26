from django.test import RequestFactory, TestCase
from django.utils import timezone
from rest_framework import permissions, views
from rest_framework.response import Response
from rest_framework.test import force_authenticate

from common.errors import EMAIL_VERIFICATION_REQUIRED
from common.permissions import EmailVerifiedForWrites
from users.models import User


class ProbeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, EmailVerifiedForWrites]

    def get(self, request):
        return Response({"ok": True})

    def post(self, request):
        return Response({"ok": True})


class EmailVerifiedForWritesTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(email="reader@example.com", password="testpass123")

    def test_allows_safe_methods_when_unverified(self):
        request = self.factory.get("/probe")
        force_authenticate(request, user=self.user)
        response = ProbeView.as_view()(request)
        self.assertEqual(response.status_code, 200)

    def test_blocks_writes_when_unverified(self):
        request = self.factory.post("/probe")
        force_authenticate(request, user=self.user)
        response = ProbeView.as_view()(request)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], EMAIL_VERIFICATION_REQUIRED)

    def test_allows_writes_when_verified(self):
        self.user.email_verified_at = timezone.now()
        self.user.save(update_fields=["email_verified_at"])
        request = self.factory.post("/probe")
        force_authenticate(request, user=self.user)
        response = ProbeView.as_view()(request)
        self.assertEqual(response.status_code, 200)
