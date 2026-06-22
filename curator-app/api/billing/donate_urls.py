"""Public URLs for the mobile donate checkout page (no service imports)."""

from django.conf import settings


def mobile_donate_page_url() -> str:
    override = (getattr(settings, "MOBILE_DONATE_URL", "") or "").strip().rstrip("/")
    if override:
        return override
    api_base = (settings.API_PUBLIC_BASE_URL or "").strip().rstrip("/")
    if api_base:
        return f"{api_base}/m/donate"
    return f"{settings.WEB_BASE_URL.rstrip('/')}/donate"


def mobile_donate_callback_url() -> str:
    api_base = (settings.API_PUBLIC_BASE_URL or "").strip().rstrip("/")
    if api_base:
        return f"{api_base}/m/donate/callback"
    return f"{settings.WEB_BASE_URL.rstrip('/')}/m/donate/callback"
