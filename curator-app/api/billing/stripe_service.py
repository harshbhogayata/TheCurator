"""Stripe checkout/portal/webhook handling for web subscriptions.

Runs alongside the RevenueCat path (mobile IAP). Both converge on
UserEntitlement, which is the single source of truth for access.
"""

import logging
from datetime import UTC, datetime

from django.conf import settings
from django.db import transaction

from billing.models import StripeWebhookEvent
from mobileapi.models import SubscriptionTier, UserEntitlement
from users.models import User

logger = logging.getLogger(__name__)


class StripeNotConfigured(RuntimeError):
    pass


class StripeServiceError(RuntimeError):
    pass


def _stripe():
    import stripe

    if not settings.STRIPE_SECRET_KEY:
        raise StripeNotConfigured("STRIPE_SECRET_KEY is not configured.")
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def _price_id_for_tier(tier):
    price_map = settings.STRIPE_TIER_PRICE_MAP or {}
    price_id = price_map.get(tier)
    if not price_id:
        raise StripeServiceError(f"No Stripe price configured for tier '{tier}'.")
    return price_id


def _tier_for_price_id(price_id):
    price_map = settings.STRIPE_TIER_PRICE_MAP or {}
    for tier, configured in price_map.items():
        if configured == price_id:
            return tier
    return SubscriptionTier.FREE


def _get_or_create_entitlement(user):
    entitlement, _ = UserEntitlement.objects.get_or_create(user=user)
    return entitlement


def create_checkout_session(user, tier):
    """Create a Stripe Checkout session for a subscription or lifetime purchase."""
    if tier not in {SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.LIFETIME}:
        raise StripeServiceError(f"Unsupported tier '{tier}'.")

    stripe = _stripe()
    site_url = settings.WEB_BASE_URL.rstrip("/")
    entitlement = _get_or_create_entitlement(user)

    params = {
        "mode": "payment" if tier == SubscriptionTier.LIFETIME else "subscription",
        "line_items": [{"price": _price_id_for_tier(tier), "quantity": 1}],
        "client_reference_id": str(user.id),
        "metadata": {"tier": tier, "user_id": str(user.id)},
        "success_url": f"{site_url}/donate?status=success",
        "cancel_url": f"{site_url}/donate?status=cancelled",
        "allow_promotion_codes": True,
    }
    if entitlement.stripe_customer_id:
        params["customer"] = entitlement.stripe_customer_id
    elif user.email:
        params["customer_email"] = user.email
    if params["mode"] == "subscription":
        params["subscription_data"] = {"metadata": {"tier": tier, "user_id": str(user.id)}}

    session = stripe.checkout.Session.create(**params)
    return session.url


def create_portal_session(user):
    """Create a Stripe customer portal session for managing the subscription."""
    stripe = _stripe()
    entitlement = _get_or_create_entitlement(user)
    if not entitlement.stripe_customer_id:
        raise StripeServiceError("No Stripe customer on file for this account.")

    session = stripe.billing_portal.Session.create(
        customer=entitlement.stripe_customer_id,
        return_url=f"{settings.WEB_BASE_URL.rstrip('/')}/settings",
    )
    return session.url


def verify_webhook(payload, signature_header):
    import stripe

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise StripeNotConfigured("STRIPE_WEBHOOK_SECRET is not configured.")
    return stripe.Webhook.construct_event(
        payload, signature_header, settings.STRIPE_WEBHOOK_SECRET
    )


def _datetime_from_ts(value):
    if not value:
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=UTC)
    except (TypeError, ValueError, OSError):
        return None


def _resolve_user(stripe_object):
    user_id = (stripe_object.get("metadata") or {}).get("user_id") or stripe_object.get(
        "client_reference_id"
    )
    if user_id:
        user = User.objects.filter(id=user_id).first()
        if user:
            return user

    customer_id = stripe_object.get("customer")
    if customer_id:
        entitlement = UserEntitlement.objects.filter(
            stripe_customer_id=customer_id
        ).select_related("user").first()
        if entitlement:
            return entitlement.user
    return None


def _apply_checkout_completed(session):
    user = _resolve_user(session)
    if user is None:
        logger.warning("Stripe checkout completed for unknown user: %s", session.get("id"))
        return None

    tier = (session.get("metadata") or {}).get("tier") or SubscriptionTier.PREMIUM
    entitlement = _get_or_create_entitlement(user)
    entitlement.stripe_customer_id = session.get("customer") or entitlement.stripe_customer_id
    entitlement.stripe_subscription_id = (
        session.get("subscription") or entitlement.stripe_subscription_id or ""
    )
    entitlement.tier = tier
    entitlement.product_id = f"stripe:{tier}"
    if tier == SubscriptionTier.LIFETIME:
        entitlement.expires_at = None
        entitlement.will_renew = False
    else:
        entitlement.will_renew = True
    entitlement.save()
    return user


def _apply_subscription_update(subscription, *, deleted=False):
    user = _resolve_user(subscription)
    if user is None:
        logger.warning(
            "Stripe subscription event for unknown customer: %s", subscription.get("id")
        )
        return None

    entitlement = _get_or_create_entitlement(user)
    if entitlement.tier == SubscriptionTier.LIFETIME and deleted:
        # Lifetime purchases are one-time payments; ignore stray sub deletions.
        return user

    if deleted or subscription.get("status") in {"canceled", "unpaid", "incomplete_expired"}:
        entitlement.tier = SubscriptionTier.FREE
        entitlement.will_renew = False
        entitlement.expires_at = _datetime_from_ts(
            subscription.get("ended_at") or subscription.get("current_period_end")
        )
        entitlement.save()
        return user

    items = (subscription.get("items") or {}).get("data") or []
    price_id = items[0]["price"]["id"] if items else ""
    tier = (subscription.get("metadata") or {}).get("tier") or _tier_for_price_id(price_id)

    entitlement.tier = tier
    entitlement.stripe_subscription_id = subscription.get("id") or entitlement.stripe_subscription_id
    entitlement.stripe_customer_id = subscription.get("customer") or entitlement.stripe_customer_id
    entitlement.product_id = f"stripe:{tier}"
    entitlement.expires_at = _datetime_from_ts(subscription.get("current_period_end"))
    entitlement.will_renew = not subscription.get("cancel_at_period_end", False)
    entitlement.save()
    return user


@transaction.atomic
def process_stripe_webhook(event):
    """Idempotently apply a verified Stripe event to UserEntitlement."""
    event_id = event["id"]
    event_type = event["type"]

    if StripeWebhookEvent.objects.filter(event_id=event_id).exists():
        return

    data_object = event["data"]["object"]
    user = None

    if event_type == "checkout.session.completed":
        user = _apply_checkout_completed(data_object)
    elif event_type in {"customer.subscription.updated", "customer.subscription.created"}:
        user = _apply_subscription_update(data_object)
    elif event_type == "customer.subscription.deleted":
        user = _apply_subscription_update(data_object, deleted=True)

    StripeWebhookEvent.objects.create(
        event_id=event_id,
        event_type=event_type,
        payload={"object_id": data_object.get("id", "")},
        user=user,
    )
