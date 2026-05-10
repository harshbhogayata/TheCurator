import logging

from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone
from firebase_admin.auth import UserNotFoundError
from firebase_admin.exceptions import FirebaseError
from rest_framework import generics, permissions, response, status, views

from users.serializers import AccountUpdateSerializer, SessionSerializer
from users.services.firebase import delete_firebase_user, get_firebase_user
from users.services.provisioning import sync_user_identities_from_firebase_user


logger = logging.getLogger(__name__)


def _sync_identities_for_user(user, *, fail_silently):
    firebase_uid = getattr(user, "firebase_uid", "") or ""
    if not firebase_uid:
        return True

    try:
        firebase_user = get_firebase_user(firebase_uid)
        sync_user_identities_from_firebase_user(user, firebase_user)
        return True
    except (ImproperlyConfigured, FirebaseError) as exc:
        logger.warning("Unable to sync Firebase identities for user %s: %s", user.id, exc)
        if fail_silently:
            return False
        raise


class CurrentSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "auth_session"

    def post(self, request):
        _sync_identities_for_user(request.user, fail_silently=True)
        return response.Response(SessionSerializer(request.user).data)


class ScopedThrottleMixin:
    read_throttle_scope = "reads"
    write_throttle_scope = "writes"
    throttle_scope = "reads"

    def get_throttles(self):
        if self.request.method in permissions.SAFE_METHODS:
            self.throttle_scope = self.read_throttle_scope
        else:
            self.throttle_scope = self.write_throttle_scope
        return super().get_throttles()


class AccountView(ScopedThrottleMixin, generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccountUpdateSerializer

    def get_throttles(self):
        if self.request.method == "DELETE":
            self.write_throttle_scope = "sensitive"
        else:
            self.write_throttle_scope = "writes"
        return super().get_throttles()

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        return response.Response(SessionSerializer(request.user).data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(SessionSerializer(request.user).data)

    def delete(self, request, *args, **kwargs):
        auth_time = getattr(request, "firebase_claims", {}).get("auth_time")
        now_epoch = int(timezone.now().timestamp())

        if not isinstance(auth_time, (int, float)) or (now_epoch - int(auth_time)) > 300:
            return response.Response(
                {
                    "detail": "Please re-authenticate before deleting your account.",
                    "code": "reauth_required",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        user = self.get_object()

        firebase_uid = getattr(user, "firebase_uid", "") or ""
        if firebase_uid:
            try:
                delete_firebase_user(firebase_uid)
            except UserNotFoundError:
                logger.info("Firebase user %s was already missing during account deletion.", firebase_uid)
            except (ImproperlyConfigured, FirebaseError) as exc:
                logger.warning("Unable to delete Firebase user %s: %s", firebase_uid, exc)
                return response.Response(
                    {
                        "detail": "We couldn't complete account deletion right now. Please try again.",
                        "code": "service_unavailable",
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        user.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class IdentityListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reads"

    def get(self, request):
        _sync_identities_for_user(request.user, fail_silently=True)
        return response.Response(SessionSerializer(request.user).data["identities"])


class IdentitySyncView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "writes"

    def post(self, request):
        try:
            _sync_identities_for_user(request.user, fail_silently=False)
        except (ImproperlyConfigured, FirebaseError):
            return response.Response(
                {
                    "detail": "We couldn't refresh linked providers right now.",
                    "code": "service_unavailable",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return response.Response(SessionSerializer(request.user).data)
