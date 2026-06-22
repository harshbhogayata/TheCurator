"""Authenticate API requests with Firebase ID tokens or short-lived checkout handoff tokens."""

from __future__ import annotations

import logging

from django.core import signing
from django.core.exceptions import ImproperlyConfigured
from firebase_admin.exceptions import FirebaseError
from rest_framework import authentication, exceptions

from users.models import User
from users.services.firebase import verify_firebase_token
from users.services.provisioning import provision_user_from_claims

logger = logging.getLogger(__name__)

CHECKOUT_HANDOFF_SALT = "billing.checkout-handoff"
CHECKOUT_HANDOFF_MAX_AGE_SECONDS = 600


def create_checkout_handoff_token(user: User, plan: str = "") -> str:
    return signing.dumps(
        {"user_id": str(user.id), "plan": plan or ""},
        salt=CHECKOUT_HANDOFF_SALT,
    )


def _user_from_checkout_handoff(token: str) -> User:
    payload = signing.loads(token, salt=CHECKOUT_HANDOFF_SALT, max_age=CHECKOUT_HANDOFF_MAX_AGE_SECONDS)
    user_id = payload.get("user_id")
    if not user_id:
        raise signing.BadSignature("missing user_id")
    user = User.objects.filter(id=user_id).first()
    if user is None:
        raise signing.BadSignature("unknown user")
    return user


class FirebaseOrCheckoutHandoffAuthentication(authentication.BaseAuthentication):
    keyword = "bearer"

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()
        if not auth_header:
            return None

        if auth_header[0].decode("utf-8").lower() != self.keyword:
            return None

        if len(auth_header) != 2:
            raise exceptions.AuthenticationFailed("Invalid bearer token.")

        token = auth_header[1].decode("utf-8")

        try:
            claims = verify_firebase_token(token)
            user = provision_user_from_claims(claims)
            request.firebase_claims = claims
            return (user, claims)
        except ImproperlyConfigured as exc:
            raise exceptions.AuthenticationFailed(str(exc)) from exc
        except ValueError:
            pass
        except FirebaseError as exc:
            logger.warning("Firebase authentication verification failed.", exc_info=True)
            if "Token used too early" in str(exc):
                raise exceptions.AuthenticationFailed(
                    "Authentication could not be verified because the server clock is out of sync.",
                ) from exc

        try:
            user = _user_from_checkout_handoff(token)
            return (user, {"checkout_handoff": True})
        except signing.BadSignature as exc:
            raise exceptions.AuthenticationFailed("Invalid or expired checkout token.") from exc
