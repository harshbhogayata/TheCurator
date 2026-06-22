import logging
from urllib.parse import parse_qs, urlencode, urlparse

from django.conf import settings
from firebase_admin import auth as firebase_auth
from firebase_admin.auth import UserNotFoundError

from publicapi.email_delivery import deliver_email
from publicapi.email_templates import build_curator_email_body, build_curator_email_html
from users.auth_page_urls import mobile_reset_password_page_url
from users.services.verification_email import VERIFY_QUERY_KEYS

logger = logging.getLogger(__name__)


def build_click_to_reset_url(admin_link: str) -> str:
    """Rewrite Firebase's auto-apply handler URL to our click-to-reset page."""
    parsed = urlparse(admin_link)
    query = parse_qs(parsed.query, keep_blank_values=True)
    flat = {key: values[0] for key, values in query.items() if values}
    params = {key: flat[key] for key in VERIFY_QUERY_KEYS if flat.get(key)}
    if not params.get("oobCode") or params.get("mode") != "resetPassword":
        raise ValueError("Firebase password reset link is missing action parameters.")

    base = mobile_reset_password_page_url()
    return f"{base}?{urlencode(params)}"


def send_password_reset_email(*, email: str) -> bool:
    page_url = mobile_reset_password_page_url()
    continue_url = f"{page_url}?status=done"
    action_settings = firebase_auth.ActionCodeSettings(
        url=continue_url,
        handle_code_in_app=False,
    )

    try:
        admin_link = firebase_auth.generate_password_reset_link(email, action_settings)
    except UserNotFoundError:
        # Do not reveal whether the account exists.
        return True

    reset_url = build_click_to_reset_url(admin_link)
    paragraphs = [
        "We received a request to reset the password for your Curator account.",
        "Tap the button below, then choose a new password on the next page.",
        "Use only the newest reset email. Older links stop working once you request another.",
    ]

    message = build_curator_email_body(
        greeting="Hello,",
        paragraphs=paragraphs,
        action_label="Reset your password",
        action_url=reset_url,
        footer="If you did not ask to reset your password, you can ignore this email.",
    )
    html_message = build_curator_email_html(
        headline="Reset your password",
        greeting="Hello,",
        paragraphs=paragraphs,
        action_label="Reset your password",
        action_url=reset_url,
        footer="If you did not ask to reset your password, you can ignore this email.",
    )

    sent = deliver_email(
        subject="Reset your Curator password",
        message=message,
        html_message=html_message,
        recipients=[email],
    )
    if not sent:
        logger.error("Password reset email delivery failed for %s", email)
    return sent
