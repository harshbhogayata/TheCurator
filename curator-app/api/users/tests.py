from types import SimpleNamespace
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from users.models import IdentityProvider, User, UserIdentity
from users.views import AccountView, CurrentSessionView, IdentitySyncView


class UserViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="reader@example.com",
            password="secret123",
            firebase_uid="firebase-reader-123",
        )
        self.factory = APIRequestFactory()

    def test_current_session_syncs_linked_identities_from_firebase(self):
        request = self.factory.post("/api/mobile/auth/session")
        force_authenticate(request, user=self.user)

        firebase_user = SimpleNamespace(
            uid=self.user.firebase_uid,
            email=self.user.email,
            provider_data=[
                SimpleNamespace(provider_id="password", uid=self.user.firebase_uid, email=self.user.email),
                SimpleNamespace(provider_id="google.com", uid="google-uid-1", email=self.user.email),
            ],
        )

        with patch("users.views.get_firebase_user", return_value=firebase_user):
            response = CurrentSessionView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(UserIdentity.objects.filter(user=self.user).values_list("provider", flat=True)),
            {IdentityProvider.EMAIL, IdentityProvider.GOOGLE},
        )

    def test_identity_sync_returns_service_unavailable_when_firebase_lookup_fails(self):
        request = self.factory.post("/api/mobile/account/identities/sync")
        force_authenticate(request, user=self.user)

        with patch("users.views.get_firebase_user", side_effect=ImproperlyConfigured("boom")):
            response = IdentitySyncView.as_view()(request)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "service_unavailable")

    def test_account_delete_removes_firebase_user_and_local_user(self):
        request = self.factory.delete("/api/mobile/account")
        force_authenticate(request, user=self.user)
        request.firebase_claims = {"auth_time": int(timezone.now().timestamp())}

        with patch("users.views.delete_firebase_user") as delete_remote_user:
            response = AccountView.as_view()(request)

        self.assertEqual(response.status_code, 204)
        delete_remote_user.assert_called_once_with(self.user.firebase_uid)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())
