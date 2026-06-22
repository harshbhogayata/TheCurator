import logging
from urllib.parse import parse_qs, urlencode, urlparse

from django.conf import settings
from firebase_admin import auth as firebase_auth

from publicapi.email_delivery import deliver_email
from publicapi.email_templates import build_curator_email_body, build_curator_email_html

logger = logging.getLogger(__name__)

VERIFY_QUERY_KEYS = ("mode", "oobCode", "apiKey", "lang", "continueUrl")


def build_click_to_verify_url(admin_link: str) -> str:
    """Rewrite Firebase's auto-apply handler URL to our click-to-verify page."""
    parsed = urlparse(admin_link)
    query = parse_qs(parsed.query, keep_blank_values=True)
    flat = {key: values[0] for key, values in query.items() if values}
    params = {key: flat[key] for key in VERIFY_QUERY_KEYS if flat.get(key)}
    if not params.get("oobCode") or not params.get("mode"):
        raise ValueError("Firebase verification link is missing action parameters.")

    base = settings.WEB_BASE_URL.rstrip("/") + "/verify-email"
    return f"{base}?{urlencode(params)}"


def send_verification_email(*, email: str) -> bool:
    continue_url = f"{settings.WEB_BASE_URL.rstrip('/')}/verify-email?status=done"
    action_settings = firebase_auth.ActionCodeSettings(
        url=continue_url,
        handle_code_in_app=False,
    )
    admin_link = firebase_auth.generate_email_verification_link(email, action_settings)
    verify_url = build_click_to_verify_url(admin_link)

    subject = "Verify your email for The Curator"
    paragraphs = [
        "Thanks for creating your Curator account.",
        "Tap the button below, then confirm your email on the next page.",
        "Use only the newest verification email if you requested another.",
    ]
    message = build_curator_email_body(
        greeting="Welcome to The Curator.",
        paragraphs=paragraphs,
        action_label="Verify your email",
        action_url=verify_url,
    )
    html_message = build_curator_email_html(
        headline="Verify your email",
        greeting="Welcome to The Curator.",
        paragraphs=paragraphs,
        action_label="Verify your email",
        action_url=verify_url,
    )

    sent = deliver_email(
        subject=subject,
        message=message,
        html_message=html_message,
        recipients=[email],
    )
    if not sent:
        logger.error("Verification email delivery failed for %s", email)
    return sent
