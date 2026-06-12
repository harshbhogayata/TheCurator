from django.test import TestCase

from billing.models import StripeWebhookEvent
from billing.stripe_service import process_stripe_webhook
from mobileapi.models import SubscriptionTier, UserEntitlement
from users.models import User


def _checkout_event(user, *, event_id="evt_1", tier="premium"):
    return {
        "id": event_id,
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_1",
                "client_reference_id": str(user.id),
                "customer": "cus_123",
                "subscription": "sub_123",
                "metadata": {"tier": tier, "user_id": str(user.id)},
            }
        },
    }


def _subscription_event(event_type, *, event_id, status="active", cancel_at_period_end=False):
    return {
        "id": event_id,
        "type": event_type,
        "data": {
            "object": {
                "id": "sub_123",
                "customer": "cus_123",
                "status": status,
                "cancel_at_period_end": cancel_at_period_end,
                "current_period_end": 4102444800,
                "metadata": {"tier": "premium"},
                "items": {"data": [{"price": {"id": "price_premium"}}]},
            }
        },
    }


class StripeWebhookProcessingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="stripe@example.com",
            password="x",
            firebase_uid="stripe-uid",
        )

    def test_checkout_completed_upgrades_entitlement(self):
        process_stripe_webhook(_checkout_event(self.user))

        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertEqual(entitlement.tier, SubscriptionTier.PREMIUM)
        self.assertEqual(entitlement.stripe_customer_id, "cus_123")
        self.assertEqual(entitlement.stripe_subscription_id, "sub_123")
        self.assertTrue(entitlement.will_renew)

    def test_webhook_is_idempotent(self):
        event = _checkout_event(self.user)
        process_stripe_webhook(event)
        process_stripe_webhook(event)

        self.assertEqual(StripeWebhookEvent.objects.filter(event_id="evt_1").count(), 1)

    def test_subscription_updated_sets_expiry_and_renewal(self):
        process_stripe_webhook(_checkout_event(self.user))
        process_stripe_webhook(
            _subscription_event(
                "customer.subscription.updated",
                event_id="evt_2",
                cancel_at_period_end=True,
            )
        )

        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertEqual(entitlement.tier, SubscriptionTier.PREMIUM)
        self.assertFalse(entitlement.will_renew)
        self.assertIsNotNone(entitlement.expires_at)

    def test_subscription_deleted_downgrades_to_free(self):
        process_stripe_webhook(_checkout_event(self.user))
        process_stripe_webhook(
            _subscription_event(
                "customer.subscription.deleted",
                event_id="evt_3",
                status="canceled",
            )
        )

        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertEqual(entitlement.tier, SubscriptionTier.FREE)
        self.assertFalse(entitlement.will_renew)

    def test_lifetime_checkout_has_no_expiry(self):
        process_stripe_webhook(_checkout_event(self.user, event_id="evt_4", tier="lifetime"))

        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertEqual(entitlement.tier, SubscriptionTier.LIFETIME)
        self.assertIsNone(entitlement.expires_at)
        self.assertFalse(entitlement.will_renew)
