"""Firebase Identity Toolkit REST helpers (server-side auth actions)."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

IDENTITY_TOOLKIT_BASE = "https://identitytoolkit.googleapis.com/v1"


class FirebaseIdentityError(Exception):
    def __init__(self, message: str, *, code: str = "unknown"):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class PasswordResetResult:
    email: str


def _api_key() -> str:
    key = (settings.FIREBASE_WEB_API_KEY or "").strip()
    if not key:
        raise FirebaseIdentityError(
            "Firebase web API key is not configured.",
            code="misconfigured",
        )
    return key


def _parse_identity_error(payload: dict) -> FirebaseIdentityError:
    error = payload.get("error") if isinstance(payload, dict) else None
    if not isinstance(error, dict):
        return FirebaseIdentityError("Authentication request failed.", code="unknown")

    message = str(error.get("message") or "Authentication request failed.")
    normalized = message.upper().replace(" ", "_")

    if "INVALID_OOB_CODE" in normalized or "INVALID_ACTION_CODE" in normalized:
        return FirebaseIdentityError(
            "This link is invalid or was already used.",
            code="invalid_action_code",
        )
    if "EXPIRED_OOB_CODE" in normalized or "EXPIRED_ACTION_CODE" in normalized:
        return FirebaseIdentityError(
            "This link has expired.",
            code="expired_action_code",
        )
    if "WEAK_PASSWORD" in normalized:
        return FirebaseIdentityError(
            "Choose a stronger password with at least 8 characters.",
            code="weak_password",
        )
    if "RESET_PASSWORD_EXCEED_LIMIT" in normalized:
        return FirebaseIdentityError(
            "Too many reset attempts. Request a new link from the app.",
            code="too_many_attempts",
        )

    logger.warning("Firebase identity error: %s", message)
    return FirebaseIdentityError(message, code="unknown")


def confirm_password_reset(*, oob_code: str, new_password: str) -> PasswordResetResult:
    """Apply a Firebase password-reset code without browser client SDK."""
    response = requests.post(
        f"{IDENTITY_TOOLKIT_BASE}/accounts:resetPassword",
        params={"key": _api_key()},
        json={"oobCode": oob_code, "newPassword": new_password},
        timeout=15,
    )
    try:
        payload = response.json()
    except ValueError:
        payload = {}

    if not response.ok:
        raise _parse_identity_error(payload if isinstance(payload, dict) else {})

    email = ""
    if isinstance(payload, dict):
        email = str(payload.get("email") or "").strip()
    return PasswordResetResult(email=email)


def apply_email_verification(*, oob_code: str) -> str:
    """Apply a Firebase email-verification code without browser client SDK."""
    response = requests.post(
        f"{IDENTITY_TOOLKIT_BASE}/accounts:update",
        params={"key": _api_key()},
        json={"oobCode": oob_code},
        timeout=15,
    )
    try:
        payload = response.json()
    except ValueError:
        payload = {}

    if not response.ok:
        raise _parse_identity_error(payload if isinstance(payload, dict) else {})

    if isinstance(payload, dict):
        email = str(payload.get("email") or "").strip()
        if email:
            return email
    return ""
