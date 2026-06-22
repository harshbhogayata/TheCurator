import logging
from urllib.parse import parse_qs, urlencode, urlparse

from publicapi.email_delivery import deliver_email, email_delivery_configured
from publicapi.email_templates import build_curator_email_body, build_curator_email_html
from users.auth_page_urls import mobile_verify_email_page_url
from users.services.firebase_action_links import generate_email_verification_admin_link
from users.services.password_reset_email import ACTION_QUERY_KEYS

logger = logging.getLogger(__name__)

# Backwards-compatible alias for tests importing VERIFY_QUERY_KEYS.
VERIFY_QUERY_KEYS = ACTION_QUERY_KEYS + ("apiKey", "lang", "continueUrl")


def build_click_to_verify_url(admin_link: str) -> str:
    """Rewrite Firebase's auto-apply handler URL to our click-to-verify page."""
    parsed = urlparse(admin_link)
    query = parse_qs(parsed.query, keep_blank_values=True)
    flat = {key: values[0] for key, values in query.items() if values}
    params = {key: flat[key] for key in ACTION_QUERY_KEYS if flat.get(key)}
    if not params.get("oobCode") or not params.get("mode"):
        raise ValueError("Firebase verification link is missing action parameters.")

    base = mobile_verify_email_page_url()
    return f"{base}?{urlencode(params)}"


def send_verification_email(*, email: str) -> bool:
    if not email_delivery_configured():
        logger.error("Verification email requested but email delivery is not configured")
        return False

    admin_link = generate_email_verification_admin_link(email)
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
