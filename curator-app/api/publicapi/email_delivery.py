import logging

import requests
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def deliver_email(*, subject: str, message: str, recipients: list[str], from_email: str | None = None) -> bool:
    """Send via Resend when configured, otherwise Django SMTP/console."""
    to = [r.strip() for r in recipients if r and r.strip()]
    if not to:
        return False

    sender = (from_email or getattr(settings, "RESEND_FROM_EMAIL", "") or settings.DEFAULT_FROM_EMAIL).strip()
    api_key = getattr(settings, "RESEND_API_KEY", "").strip()

    if api_key:
        return _send_resend(api_key=api_key, sender=sender, to=to, subject=subject, message=message)

    sent = send_mail(
        subject=subject,
        message=message,
        from_email=sender,
        recipient_list=to,
        fail_silently=False,
    )
    return sent > 0


def _send_resend(*, api_key: str, sender: str, to: list[str], subject: str, message: str) -> bool:
    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": sender,
                "to": to,
                "subject": subject,
                "text": message,
            },
            timeout=15,
        )
        if response.ok:
            return True
        logger.error("Resend API error %s: %s", response.status_code, response.text)
        return False
    except Exception:
        logger.exception("Resend request failed")
        return False
