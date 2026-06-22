"""Generate Firebase auth action links with safe continue-URL fallbacks."""

from __future__ import annotations

import logging

from django.conf import settings
from firebase_admin import auth as firebase_auth
from firebase_admin.auth import UserNotFoundError

logger = logging.getLogger(__name__)


def _firebase_auth_origin() -> str:
    domain = (settings.FIREBASE_WEB_AUTH_DOMAIN or "").strip().rstrip("/")
    if domain:
        return f"https://{domain}"
    project_id = (settings.FIREBASE_PROJECT_ID or "").strip()
    if project_id:
        return f"https://{project_id}.firebaseapp.com"
    return "https://localhost"


def _continue_url_candidates(done_path: str) -> list[str | None]:
    """Prefer marketing-site URLs (usually already authorized in Firebase)."""
    candidates: list[str | None] = []
    web_base = (settings.WEB_BASE_URL or "").strip().rstrip("/")
    if web_base:
        candidates.append(f"{web_base}{done_path}")
    origin = _firebase_auth_origin()
    candidates.append(f"{origin}/__/auth/action")
    candidates.append(None)
    return candidates


def generate_password_reset_admin_link(email: str) -> str:
    last_error: Exception | None = None
    for continue_url in _continue_url_candidates("/reset-password?status=done"):
        try:
            if continue_url:
                action_settings = firebase_auth.ActionCodeSettings(
                    url=continue_url,
                    handle_code_in_app=False,
                )
                return firebase_auth.generate_password_reset_link(email, action_settings)
            return firebase_auth.generate_password_reset_link(email)
        except UserNotFoundError:
            raise
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Password reset link generation failed (continue_url=%s): %s",
                continue_url,
                exc,
            )
    if last_error is not None:
        raise last_error
    raise RuntimeError("Password reset link generation failed.")


def generate_email_verification_admin_link(email: str) -> str:
    last_error: Exception | None = None
    for continue_url in _continue_url_candidates("/verify-email?status=done"):
        try:
            if continue_url:
                action_settings = firebase_auth.ActionCodeSettings(
                    url=continue_url,
                    handle_code_in_app=False,
                )
                return firebase_auth.generate_email_verification_link(email, action_settings)
            return firebase_auth.generate_email_verification_link(email)
        except Exception as exc:
            last_error = exc
            logger.warning(
                "Verification link generation failed (continue_url=%s): %s",
                continue_url,
                exc,
            )
    if last_error is not None:
        raise last_error
    raise RuntimeError("Verification link generation failed.")
