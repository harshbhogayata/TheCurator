from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Send a one-off launch-notify test email to LAUNCH_NOTIFY_FORWARD_EMAIL."

    def handle(self, *args, **options):
        recipient = settings.LAUNCH_NOTIFY_FORWARD_EMAIL.strip() or "harsh@thecuratorgroup.org"
        subject = "The Curator — launch notify test"
        message = (
            "This is a one-off test from send_launch_notify_test.\n\n"
            "If you received this in your inbox, SMTP is configured and launch signup "
            "forwards will work for new waitlist signups.\n"
        )

        sent = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Sent {sent} message(s) to {recipient} via {settings.EMAIL_BACKEND}"
            )
        )
