import logging

from django.conf import settings
from django.core.mail import send_mail

from publicapi.models import LaunchNotifySignup

logger = logging.getLogger(__name__)


def normalize_launch_notify_email(raw: str) -> str:
    return raw.strip().lower()


def register_launch_notify_email(*, email: str, source: str = "launch_site") -> tuple[LaunchNotifySignup, bool]:
    normalized = normalize_launch_notify_email(email)
    signup, created = LaunchNotifySignup.objects.get_or_create(
        email=normalized,
        defaults={"source": source[:64]},
    )
    if created:
        _forward_launch_notify_signup(signup)
    return signup, created


def _forward_launch_notify_signup(signup: LaunchNotifySignup) -> None:
    if not settings.LAUNCH_NOTIFY_FORWARD_ENABLED:
        return

    recipient = settings.LAUNCH_NOTIFY_FORWARD_EMAIL.strip()
    if not recipient:
        return

    subject = "The Curator — new launch notify signup"
    message = (
        f"A visitor joined the launch waitlist.\n\n"
        f"Email: {signup.email}\n"
        f"Source: {signup.source or 'launch_site'}\n"
        f"Signed up: {signup.created_at.isoformat()}\n"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Failed to forward launch notify signup for %s", signup.email)
