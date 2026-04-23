import json

import firebase_admin
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials


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
    return firebase_auth.verify_id_token(id_token, app=get_firebase_app())
