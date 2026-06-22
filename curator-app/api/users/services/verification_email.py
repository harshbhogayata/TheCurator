import logging
from urllib.parse import parse_qs, urlencode, urlparse

from django.conf import settings
from firebase_admin import auth as firebase_auth

from publicapi.email_delivery import deliver_email
from publicapi.email_templates import build_curator_email_body

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

    base = settings.WEB_BASE_URL.rstrip("/") + "/verify-email.html"
    return f"{base}?{urlencode(params)}"


def send_verification_email(*, email: str) -> bool:
    continue_url = f"{settings.WEB_BASE_URL.rstrip('/')}/verify-email.html?status=done"
    action_settings = firebase_auth.ActionCodeSettings(
        url=continue_url,
        handle_code_in_app=False,
    )
    admin_link = firebase_auth.generate_email_verification_link(email, action_settings)
    verify_url = build_click_to_verify_url(admin_link)

    subject = "Verify your email for The Curator"
    message = build_curator_email_body(
        greeting="Welcome to The Curator.",
        paragraphs=[
            "Thanks for creating an account.",
            "Open the link below, then tap Verify on the page to confirm your email.",
            "Some email apps open links in the background — using the button on our page",
            "stops the link from being used before you are ready.",
            "If a link says it expired or was already used, tap Resend in the app and open",
            "only the newest message.",
        ],
        action_label="Verify your email",
        action_url=verify_url,
    )

    sent = deliver_email(
        subject=subject,
        message=message,
        recipients=[email],
    )
    if not sent:
        logger.error("Verification email delivery failed for %s", email)
    return sent
