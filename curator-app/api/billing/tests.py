from django.test import TestCase

from billing.models import RazorpayWebhookEvent, StripeWebhookEvent
from billing.razorpay_service import process_razorpay_webhook
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


def _razorpay_payment_event(user, *, event_id="payment.captured:pay_1", tier="lifetime"):
    return {
        "event": "payment.captured",
        "created_at": 1710000000,
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_1",
                    "order_id": "order_1",
                    "notes": {"user_id": str(user.id), "tier": tier},
                }
            }
        },
    }


def _razorpay_subscription_event(
    user,
    *,
    event_type="subscription.activated",
    event_id="subscription.activated:sub_1",
    status="active",
):
    return {
        "event": event_type,
        "created_at": 1710000001,
        "payload": {
            "subscription": {
                "entity": {
                    "id": "sub_1",
                    "plan_id": "plan_premium",
                    "status": status,
                    "current_end": 4102444800,
                    "notes": {"user_id": str(user.id), "tier": "premium"},
                }
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


class RazorpayWebhookProcessingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="razorpay@example.com",
            password="x",
            firebase_uid="razorpay-uid",
        )

    def test_payment_captured_grants_lifetime(self):
        process_razorpay_webhook(_razorpay_payment_event(self.user))

        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertEqual(entitlement.tier, SubscriptionTier.LIFETIME)
        self.assertEqual(entitlement.razorpay_payment_id, "pay_1")
        self.assertFalse(entitlement.will_renew)

    def test_subscription_activated_grants_premium(self):
        process_razorpay_webhook(_razorpay_subscription_event(self.user))

        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertEqual(entitlement.tier, SubscriptionTier.PREMIUM)
        self.assertEqual(entitlement.razorpay_subscription_id, "sub_1")
        self.assertTrue(entitlement.will_renew)

    def test_webhook_is_idempotent(self):
        event = _razorpay_subscription_event(self.user)
        process_razorpay_webhook(event)
        process_razorpay_webhook(event)

        self.assertEqual(
            RazorpayWebhookEvent.objects.filter(
                event_id="subscription.activated:sub_1"
            ).count(),
            1,
        )

    def test_subscription_cancelled_downgrades(self):
        process_razorpay_webhook(_razorpay_subscription_event(self.user))
        process_razorpay_webhook(
            _razorpay_subscription_event(
                self.user,
                event_type="subscription.cancelled",
                event_id="subscription.cancelled:sub_1",
                status="cancelled",
            )
        )

        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertEqual(entitlement.tier, SubscriptionTier.FREE)


class RazorpayStandardOrderTests(TestCase):
    def test_create_standard_order_rejects_low_amount(self):
        from billing.razorpay_service import RazorpayServiceError, create_standard_order

        with self.assertRaises(RazorpayServiceError):
            create_standard_order(amount=50, receipt="test")
