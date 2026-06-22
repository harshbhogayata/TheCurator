from django.test import TestCase
from unittest.mock import patch

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

    def test_payment_captured_without_tier_is_ignored(self):
        event = _razorpay_payment_event(self.user)
        event["payload"]["payment"]["entity"]["notes"] = {"user_id": str(self.user.id)}
        process_razorpay_webhook(event)

        self.assertFalse(UserEntitlement.objects.filter(user=self.user).exists())

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


class RazorpayCancelSubscriptionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="cancel@example.com",
            password="x",
            firebase_uid="cancel-uid",
        )

    def test_downgrade_order_based_basic_immediately(self):
        from billing.razorpay_service import cancel_subscription

        UserEntitlement.objects.create(user=self.user, tier=SubscriptionTier.BASIC)
        result = cancel_subscription(self.user)
        self.assertEqual(result["status"], "downgraded")
        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertEqual(entitlement.tier, SubscriptionTier.FREE)

    def test_already_free_is_idempotent(self):
        from billing.razorpay_service import cancel_subscription

        UserEntitlement.objects.create(user=self.user, tier=SubscriptionTier.FREE)
        result = cancel_subscription(self.user)
        self.assertEqual(result["status"], "already_free")


class MobileDonateHandoffTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="handoff@example.com",
            password="x",
            firebase_uid="handoff-uid",
        )

    def test_build_handoff_includes_plan_in_url(self):
        from billing.handoff import build_mobile_donate_handoff

        payload = build_mobile_donate_handoff(self.user, SubscriptionTier.PREMIUM)
        self.assertIn("plan=premium", payload["donateUrl"])
        self.assertIn("/m/donate", payload["donateUrl"])
        self.assertIn("handoff=", payload["donateUrl"])
        self.assertIn("source=app", payload["donateUrl"])

    def test_build_handoff_rejects_invalid_plan(self):
        from billing.handoff import build_mobile_donate_handoff
        from billing.razorpay_service import RazorpayServiceError

        with self.assertRaises(RazorpayServiceError):
            build_mobile_donate_handoff(self.user, "gold")

    @patch("billing.handoff.create_custom_token", return_value="firebase-custom-token")
    def test_create_and_exchange_handoff(self, mock_token):
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=self.user)

        create_resp = client.post(
            "/api/billing/v1/mobile-handoff/",
            {"plan": "premium"},
            format="json",
        )
        self.assertEqual(create_resp.status_code, 200)
        token = create_resp.data["handoffToken"]

        client.force_authenticate(user=None)
        exchange_resp = client.post(
            "/api/billing/v1/mobile-handoff/exchange/",
            {"handoffToken": token},
            format="json",
        )
        self.assertEqual(exchange_resp.status_code, 200)
        self.assertIn("checkoutToken", exchange_resp.data)
        self.assertIn("customToken", exchange_resp.data)
        self.assertEqual(exchange_resp.data["customToken"], "firebase-custom-token")
        mock_token.assert_called_once_with("handoff-uid")

    def test_mobile_donate_page_renders(self):
        from django.test import Client

        response = Client().get("/m/donate?plan=premium&source=app")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Support The Curator", response.content)
        self.assertIn(b"premium", response.content)

    def test_short_receipt_respects_razorpay_limit(self):
        from billing.razorpay_service import MAX_RECEIPT_LENGTH, _short_receipt

        receipt = _short_receipt(self.user, SubscriptionTier.PREMIUM)
        self.assertLessEqual(len(receipt), MAX_RECEIPT_LENGTH)
        self.assertTrue(receipt.startswith("cur-p-"))

    @patch("billing.razorpay_service._client")
    def test_checkout_with_handoff_token_creates_order(self, mock_client_factory):
        from billing.authentication import create_checkout_handoff_token
        from rest_framework.test import APIClient

        mock_client = mock_client_factory.return_value
        mock_client.order.create.return_value = {
            "id": "order_test_1",
            "amount": 149900,
            "currency": "INR",
        }

        token = create_checkout_handoff_token(self.user, SubscriptionTier.PREMIUM)
        client = APIClient()
        response = client.post(
            "/api/billing/v1/checkout/",
            {"tier": "premium", "mode": "order"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["mode"], "order")
        self.assertEqual(response.data["orderId"], "order_test_1")

        create_payload = mock_client.order.create.call_args.args[0]
        self.assertLessEqual(len(create_payload["receipt"]), 40)

    @patch("billing.razorpay_service.verify_checkout_signature")
    def test_mobile_donate_callback_redirects_success(self, mock_verify):
        from django.test import Client

        client = Client()
        response = client.post(
            "/m/donate/callback",
            {
                "razorpay_payment_id": "pay_test",
                "razorpay_order_id": "order_test",
                "razorpay_signature": "sig_test",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertIn("status=success", response.url)
        mock_verify.assert_called_once()
