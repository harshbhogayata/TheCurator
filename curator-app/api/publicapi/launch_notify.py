import logging

from django.conf import settings

from publicapi.email_delivery import deliver_email
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
        _send_launch_confirmation(signup)
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
        deliver_email(subject=subject, message=message, recipients=[recipient])
    except Exception:
        logger.exception("Failed to forward launch notify signup for %s", signup.email)


def _send_launch_confirmation(signup: LaunchNotifySignup) -> None:
    if not settings.LAUNCH_NOTIFY_SEND_CONFIRMATION:
        return

    subject = "You're on The Curator launch list"
    message = (
        "Thanks for signing up.\n\n"
        "We'll email you once when The Curator goes live on the App Store, Google Play, "
        "and Galaxy Store. No spam until then.\n\n"
        "— The Curator\n"
        "https://thecuratorgroup.org\n"
    )

    try:
        deliver_email(subject=subject, message=message, recipients=[signup.email])
    except Exception:
        logger.exception("Failed to send launch confirmation to %s", signup.email)
