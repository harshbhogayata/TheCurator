import logging
from urllib.parse import parse_qs, urlencode, urlparse

from django.conf import settings
from firebase_admin import auth as firebase_auth

from publicapi.email_delivery import deliver_email
from publicapi.email_templates import build_curator_email_body
from users.services.verification_email import VERIFY_QUERY_KEYS, build_click_to_verify_url

logger = logging.getLogger(__name__)


def build_click_to_reset_url(admin_link: str) -> str:
    """Rewrite Firebase's auto-apply handler URL to our click-to-reset page."""
    parsed = urlparse(admin_link)
    query = parse_qs(parsed.query, keep_blank_values=True)
    flat = {key: values[0] for key, values in query.items() if values}
    params = {key: flat[key] for key in VERIFY_QUERY_KEYS if flat.get(key)}
    if not params.get("oobCode") or params.get("mode") != "resetPassword":
        raise ValueError("Firebase password reset link is missing action parameters.")

    base = settings.WEB_BASE_URL.rstrip("/") + "/reset-password"
    return f"{base}?{urlencode(params)}"


def send_password_reset_email(*, email: str) -> bool:
    continue_url = f"{settings.WEB_BASE_URL.rstrip('/')}/reset-password?status=done"
    action_settings = firebase_auth.ActionCodeSettings(
        url=continue_url,
        handle_code_in_app=False,
    )
    admin_link = firebase_auth.generate_password_reset_link(email, action_settings)
    reset_url = build_click_to_reset_url(admin_link)

    message = build_curator_email_body(
        greeting="Hello,",
        paragraphs=[
            "We received a request to reset the password for your Curator account.",
            "Open the link below, then tap the button on the page to choose a new password.",
            "Email apps sometimes open links automatically — using the button on our page",
            "keeps the reset link valid until you are ready.",
            "This link expires after a short time. If it has expired, request a new reset",
            "from the app and use only the newest email.",
        ],
        action_label="Reset your password",
        action_url=reset_url,
        footer="If you did not ask to reset your password, you can ignore this email.",
    )

    sent = deliver_email(
        subject="Reset your Curator password",
        message=message,
        recipients=[email],
    )
    if not sent:
        logger.error("Password reset email delivery failed for %s", email)
    return sent
