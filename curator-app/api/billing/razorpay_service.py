"""Razorpay checkout, verify, and webhook handling for web subscriptions.

Mobile IAP continues through RevenueCat. Web checkout uses Razorpay
International (subscriptions + one-time lifetime). Entitlements still
converge on UserEntitlement.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from django.conf import settings
from django.db import transaction

from billing.models import RazorpayWebhookEvent
from mobileapi.models import SubscriptionTier, UserEntitlement
from users.models import User

logger = logging.getLogger(__name__)

MIN_ORDER_AMOUNT = 100


class RazorpayNotConfigured(RuntimeError):
    pass


class RazorpayServiceError(RuntimeError):
    pass


def _client():
    import razorpay

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise RazorpayNotConfigured("Razorpay keys are not configured.")
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _plan_id_for_tier(tier: str) -> str:
    plan_map = settings.RAZORPAY_TIER_PLAN_MAP or {}
    plan_id = plan_map.get(tier)
    if not plan_id:
        raise RazorpayServiceError(
            f"No Razorpay plan configured for tier '{tier}'. "
            "Create a plan in the Razorpay dashboard and set RAZORPAY_TIER_PLAN_MAP."
        )
    return plan_id


def _tier_for_plan_id(plan_id: str) -> str:
    plan_map = settings.RAZORPAY_TIER_PLAN_MAP or {}
    for tier, configured in plan_map.items():
        if configured == plan_id:
            return tier
    return SubscriptionTier.PREMIUM


def _lifetime_amount() -> int:
    amount = settings.RAZORPAY_LIFETIME_AMOUNT
    if not amount or amount <= 0:
        raise RazorpayServiceError(
            "RAZORPAY_LIFETIME_AMOUNT is not configured (smallest currency unit, e.g. 29900 for $299)."
        )
    return int(amount)


def _currency() -> str:
    return (settings.RAZORPAY_CURRENCY or "INR").upper()


def _amount_for_tier(tier: str) -> int:
    amount_map = settings.RAZORPAY_TIER_AMOUNT_MAP or {}
    amount = amount_map.get(tier)
    if amount is None:
        raise RazorpayServiceError(
            f"No Razorpay amount configured for tier '{tier}'. "
            "Set RAZORPAY_TIER_AMOUNT_MAP (amounts in paise)."
        )
    amount = int(amount)
    if amount < MIN_ORDER_AMOUNT:
        raise RazorpayServiceError(f"Tier amount for '{tier}' must be at least {MIN_ORDER_AMOUNT} paise.")
    return amount


def _subscription_available_for_tier(tier: str) -> bool:
    if tier == SubscriptionTier.LIFETIME:
        return False
    plan_map = settings.RAZORPAY_TIER_PLAN_MAP or {}
    return bool(plan_map.get(tier))


def _map_razorpay_exception(exc: Exception) -> None:
    import razorpay.errors as rze

    if isinstance(exc, rze.SignatureVerificationError):
        raise RazorpayServiceError("Payment signature mismatch.") from exc
    if isinstance(exc, rze.BadRequestError):
        status_code = getattr(exc, "status_code", None)
        if status_code == 401:
            raise RazorpayServiceError("Razorpay authentication failed.") from exc
        raise RazorpayServiceError(str(exc)) from exc
    if isinstance(exc, (rze.ServerError, rze.GatewayError)):
        raise RazorpayServiceError("Razorpay API error.") from exc
    raise exc


def _get_or_create_entitlement(user: User) -> UserEntitlement:
    entitlement, _ = UserEntitlement.objects.get_or_create(user=user)
    return entitlement


def _user_notes(user: User, tier: str) -> dict[str, str]:
    return {"user_id": str(user.id), "tier": tier}


def create_standard_order(
    *,
    amount: int,
    currency: str | None = None,
    receipt: str = "",
    notes: dict | None = None,
) -> dict:
    """Razorpay Standard Checkout — create order (amount in paise)."""
    amount = int(amount)
    if amount < MIN_ORDER_AMOUNT:
        raise RazorpayServiceError(f"amount must be at least {MIN_ORDER_AMOUNT} paise.")

    client = _client()
    payload = {
        "amount": amount,
        "currency": (currency or _currency()).upper(),
        "receipt": receipt or f"rcpt_{amount}",
        "payment_capture": 1,
        "notes": notes or {},
    }
    try:
        order = client.order.create(payload)
    except Exception as exc:
        _map_razorpay_exception(exc)

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": settings.RAZORPAY_KEY_ID,
    }


def _create_order_checkout(user: User, tier: str) -> dict:
    """Order-based Standard Checkout payload for a subscription tier."""
    site_url = settings.WEB_BASE_URL.rstrip("/")
    amount = _lifetime_amount() if tier == SubscriptionTier.LIFETIME else _amount_for_tier(tier)
    order = create_standard_order(
        amount=amount,
        receipt=f"curator-{tier}-{user.id}",
        notes=_user_notes(user, tier),
    )
    return {
        "provider": "razorpay",
        "mode": "order",
        "keyId": order["key_id"],
        "tier": tier,
        "orderId": order["order_id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "prefill": {
            "email": user.email or "",
            "name": user.display_name or user.email or "",
        },
        "name": "The Curator",
        "description": f"{tier.title()} membership",
        "callbackUrl": f"{site_url}/donate?status=success",
    }


def create_checkout_payload(user: User, tier: str) -> dict:
    """Build Razorpay Checkout options for the web client."""
    if tier not in {SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.LIFETIME}:
        raise RazorpayServiceError(f"Unsupported tier '{tier}'.")

    if not _subscription_available_for_tier(tier):
        return _create_order_checkout(user, tier)

    client = _client()
    site_url = settings.WEB_BASE_URL.rstrip("/")
    prefill = {
        "email": user.email or "",
        "name": user.display_name or user.email or "",
    }

    subscription = client.subscription.create(
        {
            "plan_id": _plan_id_for_tier(tier),
            "customer_notify": 1,
            "total_count": settings.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT,
            "notes": _user_notes(user, tier),
        }
    )
    return {
        "provider": "razorpay",
        "mode": "subscription",
        "keyId": settings.RAZORPAY_KEY_ID,
        "tier": tier,
        "subscriptionId": subscription["id"],
        "prefill": prefill,
        "name": "The Curator",
        "description": f"{tier.title()} membership",
        "callbackUrl": f"{site_url}/donate?status=success",
    }


def verify_standard_payment(
    *,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> None:
    """Verify HMAC signature for Standard Checkout (order + payment)."""
    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        raise RazorpayServiceError("Missing payment verification fields.")

    client = _client()
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )
    except Exception as exc:
        _map_razorpay_exception(exc)


def verify_checkout_signature(payload: dict) -> User | None:
    """Verify client callback and upgrade entitlement when order notes include user/tier."""
    client = _client()

    payment_id = payload.get("razorpay_payment_id")
    signature = payload.get("razorpay_signature")
    order_id = payload.get("razorpay_order_id")
    subscription_id = payload.get("razorpay_subscription_id")

    if not payment_id or not signature:
        raise RazorpayServiceError("Missing Razorpay payment verification fields.")

    if order_id:
        verify_standard_payment(
            razorpay_order_id=order_id,
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
        )
        order = client.order.fetch(order_id)
        notes = order.get("notes") or {}
        user = _resolve_user_from_notes(notes)
        if user is None:
            raise RazorpayServiceError("Unable to resolve user for completed order.")
        tier = notes.get("tier") or SubscriptionTier.LIFETIME
        _apply_paid_entitlement(
            user,
            tier=tier,
            razorpay_subscription_id="",
            razorpay_payment_id=payment_id,
            expires_at=None,
            will_renew=False,
        )
        return user

    if subscription_id:
        client.utility.verify_payment_signature(
            {
                "razorpay_subscription_id": subscription_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature,
            }
        )
        subscription = client.subscription.fetch(subscription_id)
        notes = subscription.get("notes") or {}
        user = _resolve_user_from_notes(notes)
        if user is None:
            raise RazorpayServiceError("Unable to resolve user for completed subscription.")
        tier = notes.get("tier") or _tier_for_plan_id(subscription.get("plan_id", ""))
        _apply_paid_entitlement(
            user,
            tier=tier,
            razorpay_subscription_id=subscription_id,
            razorpay_payment_id=payment_id,
            expires_at=_datetime_from_ts(subscription.get("current_end")),
            will_renew=subscription.get("status") in {"active", "authenticated"},
        )
        return user

    raise RazorpayServiceError("Missing order_id or subscription_id for verification.")


def cancel_subscription(user: User) -> dict:
    """Cancel an active Razorpay subscription at the end of the billing cycle."""
    client = _client()
    entitlement = _get_or_create_entitlement(user)
    if not entitlement.razorpay_subscription_id:
        raise RazorpayServiceError("No Razorpay subscription on file for this account.")

    client.subscription.cancel(
        entitlement.razorpay_subscription_id,
        {"cancel_at_cycle_end": 1},
    )
    entitlement.will_renew = False
    entitlement.save(update_fields=["will_renew", "updated_at"])
    return {"status": "cancel_scheduled"}


def verify_webhook(body: bytes, signature_header: str) -> dict:
    import json

    if not settings.RAZORPAY_WEBHOOK_SECRET:
        raise RazorpayNotConfigured("RAZORPAY_WEBHOOK_SECRET is not configured.")

    client = _client()
    client.utility.verify_webhook_signature(
        body.decode("utf-8") if isinstance(body, bytes) else body,
        signature_header,
        settings.RAZORPAY_WEBHOOK_SECRET,
    )
    return json.loads(body)


def _datetime_from_ts(value) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=UTC)
    except (TypeError, ValueError, OSError):
        return None


def _resolve_user_from_notes(notes: dict) -> User | None:
    user_id = notes.get("user_id")
    if user_id:
        return User.objects.filter(id=user_id).first()
    return None


def _resolve_user_from_entity(entity: dict) -> User | None:
    notes = entity.get("notes") or {}
    user = _resolve_user_from_notes(notes)
    if user:
        return user

    subscription_id = entity.get("subscription_id") or entity.get("id")
    if subscription_id and entity.get("entity") == "subscription":
        subscription_id = entity.get("id")

    if subscription_id:
        entitlement = (
            UserEntitlement.objects.filter(razorpay_subscription_id=subscription_id)
            .select_related("user")
            .first()
        )
        if entitlement:
            return entitlement.user
    return None


def _apply_paid_entitlement(
    user: User,
    *,
    tier: str,
    razorpay_subscription_id: str,
    razorpay_payment_id: str,
    expires_at: datetime | None,
    will_renew: bool,
) -> User:
    entitlement = _get_or_create_entitlement(user)
    entitlement.tier = tier
    entitlement.product_id = f"razorpay:{tier}"
    if razorpay_subscription_id:
        entitlement.razorpay_subscription_id = razorpay_subscription_id
    if razorpay_payment_id:
        entitlement.razorpay_payment_id = razorpay_payment_id
    entitlement.expires_at = expires_at
    entitlement.will_renew = will_renew
    entitlement.save()
    return user


def _apply_payment_captured(payment: dict) -> User | None:
    user = _resolve_user_from_entity(payment)
    if user is None:
        logger.warning("Razorpay payment.captured for unknown user: %s", payment.get("id"))
        return None

    notes = payment.get("notes") or {}
    tier = notes.get("tier") or SubscriptionTier.LIFETIME
    _apply_paid_entitlement(
        user,
        tier=tier,
        razorpay_subscription_id="",
        razorpay_payment_id=payment.get("id", ""),
        expires_at=None,
        will_renew=False,
    )
    return user


def _apply_subscription_entity(subscription: dict, *, cancelled: bool = False) -> User | None:
    user = _resolve_user_from_entity(subscription)
    if user is None:
        logger.warning(
            "Razorpay subscription event for unknown subscription: %s", subscription.get("id")
        )
        return None

    entitlement = _get_or_create_entitlement(user)
    if entitlement.tier == SubscriptionTier.LIFETIME and cancelled:
        return user

    status = subscription.get("status", "")
    if cancelled or status in {"cancelled", "completed", "halted"}:
        entitlement.tier = SubscriptionTier.FREE
        entitlement.will_renew = False
        entitlement.expires_at = _datetime_from_ts(subscription.get("ended_at") or subscription.get("current_end"))
        entitlement.save()
        return user

    plan_id = subscription.get("plan_id", "")
    notes = subscription.get("notes") or {}
    tier = notes.get("tier") or _tier_for_plan_id(plan_id)
    _apply_paid_entitlement(
        user,
        tier=tier,
        razorpay_subscription_id=subscription.get("id", ""),
        razorpay_payment_id=entitlement.razorpay_payment_id,
        expires_at=_datetime_from_ts(subscription.get("current_end")),
        will_renew=status in {"active", "authenticated"},
    )
    return user


def _event_id(event: dict) -> str:
    event_name = event.get("event", "unknown")
    payload = event.get("payload") or {}
    for key in ("payment", "subscription", "order"):
        entity = (payload.get(key) or {}).get("entity") or {}
        if entity.get("id"):
            return f"{event_name}:{entity['id']}"
    return f"{event_name}:{event.get('created_at', '')}"


@transaction.atomic
def process_razorpay_webhook(event: dict) -> None:
    """Idempotently apply a verified Razorpay webhook to UserEntitlement."""
    event_id = _event_id(event)
    if RazorpayWebhookEvent.objects.filter(event_id=event_id).exists():
        return

    event_type = event.get("event", "")
    payload = event.get("payload") or {}
    user = None

    if event_type == "payment.captured":
        payment = (payload.get("payment") or {}).get("entity") or {}
        if not payment.get("subscription_id"):
            user = _apply_payment_captured(payment)
    elif event_type in {"subscription.activated", "subscription.charged", "subscription.resumed"}:
        subscription = (payload.get("subscription") or {}).get("entity") or {}
        user = _apply_subscription_entity(subscription)
    elif event_type in {"subscription.cancelled", "subscription.halted", "subscription.completed"}:
        subscription = (payload.get("subscription") or {}).get("entity") or {}
        user = _apply_subscription_entity(subscription, cancelled=True)

    RazorpayWebhookEvent.objects.create(
        event_id=event_id,
        event_type=event_type,
        payload={"keys": list(payload.keys())},
        user=user,
    )
