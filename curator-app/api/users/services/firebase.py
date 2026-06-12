import json
from contextlib import nullcontext
from datetime import timedelta
from unittest.mock import patch

import firebase_admin
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from google.auth import _helpers as google_auth_helpers


def _build_credentials():
    if settings.FIREBASE_CREDENTIALS_JSON:
        info = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
        if "private_key" in info and isinstance(info["private_key"], str):
            info["private_key"] = info["private_key"].replace("\\n", "\n")
        return credentials.Certificate(info)

    if settings.FIREBASE_CREDENTIALS_PATH:
        return credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)

    return None


def get_firebase_app():
    try:
        return firebase_admin.get_app()
    except ValueError:
        cred = _build_credentials()
        options = {"projectId": settings.FIREBASE_PROJECT_ID} if settings.FIREBASE_PROJECT_ID else None

        if cred:
            return firebase_admin.initialize_app(cred, options=options)

        raise ImproperlyConfigured(
            "Firebase Admin is not configured. Set FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH.",
        )


def verify_firebase_token(id_token: str):
    offset_seconds = settings.FIREBASE_LOCAL_CLOCK_OFFSET_SECONDS
    original_utcnow = google_auth_helpers.utcnow
    clock_context = (
        patch.object(
            google_auth_helpers,
            "utcnow",
            side_effect=lambda: original_utcnow() + timedelta(seconds=offset_seconds),
        )
        if offset_seconds
        else nullcontext()
    )

    with clock_context:
        return firebase_auth.verify_id_token(
            id_token,
            app=get_firebase_app(),
            clock_skew_seconds=settings.FIREBASE_CLOCK_SKEW_SECONDS,
        )


def get_firebase_user(firebase_uid: str):
    return firebase_auth.get_user(firebase_uid, app=get_firebase_app())


def delete_firebase_user(firebase_uid: str):
    return firebase_auth.delete_user(firebase_uid, app=get_firebase_app())
