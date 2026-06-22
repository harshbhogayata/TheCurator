"""Public URLs for API-hosted auth action pages (reset password, verify email)."""

from django.conf import settings


def _api_base() -> str:
    return (settings.API_PUBLIC_BASE_URL or "").strip().rstrip("/")


def mobile_reset_password_page_url() -> str:
    override = (getattr(settings, "MOBILE_RESET_PASSWORD_URL", "") or "").strip().rstrip("/")
    if override:
        return override
    api_base = _api_base()
    if api_base:
        return f"{api_base}/m/reset-password"
    return f"{settings.WEB_BASE_URL.rstrip('/')}/reset-password"


def mobile_verify_email_page_url() -> str:
    override = (getattr(settings, "MOBILE_VERIFY_EMAIL_URL", "") or "").strip().rstrip("/")
    if override:
        return override
    api_base = _api_base()
    if api_base:
        return f"{api_base}/m/verify-email"
    return f"{settings.WEB_BASE_URL.rstrip('/')}/verify-email"
