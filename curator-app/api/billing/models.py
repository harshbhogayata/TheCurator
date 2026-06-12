from django.conf import settings
from django.db import models

from common.models import UUIDPrimaryKeyModel


class StripeWebhookEvent(UUIDPrimaryKeyModel):
    """Audit/idempotency record for received Stripe webhook events."""

    event_id = models.CharField(max_length=128, unique=True)
    event_type = models.CharField(max_length=64)
    payload = models.JSONField(default=dict, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stripe_webhook_events",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event_type} · {self.event_id}"
