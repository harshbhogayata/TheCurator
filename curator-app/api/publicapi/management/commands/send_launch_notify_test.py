from django.conf import settings
from django.core.management.base import BaseCommand

from publicapi.email_delivery import deliver_email


class Command(BaseCommand):
    help = "Send a one-off launch-notify test email to LAUNCH_NOTIFY_FORWARD_EMAIL."

    def handle(self, *args, **options):
        recipient = settings.LAUNCH_NOTIFY_FORWARD_EMAIL.strip() or "harsh@thecuratorgroup.org"
        subject = "The Curator — launch notify test"
        message = (
            "This is a one-off test from send_launch_notify_test.\n\n"
            "If you received this in your inbox, email delivery is configured and launch "
            "signup notifications will work.\n"
        )

        ok = deliver_email(subject=subject, message=message, recipients=[recipient])
        backend = "Resend" if getattr(settings, "RESEND_API_KEY", "").strip() else settings.EMAIL_BACKEND

        if ok:
            self.stdout.write(self.style.SUCCESS(f"Sent test email to {recipient} via {backend}"))
        else:
            self.stdout.write(self.style.ERROR(f"Failed to send test email to {recipient} via {backend}"))
