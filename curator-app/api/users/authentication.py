import logging

from django.core.exceptions import ImproperlyConfigured
from firebase_admin.exceptions import FirebaseError
from rest_framework import authentication, exceptions

from users.services.firebase import verify_firebase_token
from users.services.provisioning import provision_user_from_claims

logger = logging.getLogger(__name__)


class FirebaseAuthentication(authentication.BaseAuthentication):
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
        except ImproperlyConfigured as exc:
            raise exceptions.AuthenticationFailed(str(exc)) from exc
        except ValueError as exc:
            raise exceptions.AuthenticationFailed(str(exc)) from exc
        except FirebaseError as exc:
            logger.exception("Firebase token verification failed: %s", exc)
            raise exceptions.AuthenticationFailed("Firebase token verification failed.") from exc

        request.firebase_claims = claims
        return (user, claims)
