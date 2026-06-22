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
from billing.donate_urls import mobile_donate_callback_url
from mobileapi.models import SubscriptionTier, UserEntitlement
from users.models import User

logger = logging.getLogger(__name__)

MIN_ORDER_AMOUNT = 100
MAX_RECEIPT_LENGTH = 40


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


def _resolve_tier_from_notes(notes: dict, *, order_amount: int | None = None) -> str:
    """Resolve paid tier from Razorpay notes and optionally validate order amount."""
    tier = str(notes.get("tier") or "").strip().lower()
    if tier not in {SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.LIFETIME}:
        raise RazorpayServiceError("Missing or invalid tier on payment order.")

    if order_amount is not None:
        expected = _lifetime_amount() if tier == SubscriptionTier.LIFETIME else _amount_for_tier(tier)
        if int(order_amount) != int(expected):
            raise RazorpayServiceError("Payment amount does not match the selected membership tier.")

    return tier


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


def _short_receipt(user: User, tier: str) -> str:
    """Razorpay receipts must be <= 40 characters."""
    compact_user = str(user.id).replace("-", "")[:10]
    receipt = f"cur-{tier[:1]}-{compact_user}"
    return receipt[:MAX_RECEIPT_LENGTH]


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
        "receipt": (receipt or f"rcpt_{amount}")[:MAX_RECEIPT_LENGTH],
        "payment_capture": 1,
        "notes": notes or {},
    }
    try:
        order = client.order.create(payload)
    except Exception as exc:
        try:
            _map_razorpay_exception(exc)
        except RazorpayServiceError:
            raise
        except Exception as inner:
            raise RazorpayServiceError(f"Razorpay order failed: {inner}") from inner

    if not isinstance(order, dict) or not order.get("id"):
        raise RazorpayServiceError("Razorpay returned an invalid order response.")

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": settings.RAZORPAY_KEY_ID,
    }


def _create_order_checkout(user: User, tier: str) -> dict:
    """Order-based Standard Checkout payload for a subscription tier."""
    amount = _lifetime_amount() if tier == SubscriptionTier.LIFETIME else _amount_for_tier(tier)
    order = create_standard_order(
        amount=amount,
        receipt=_short_receipt(user, tier),
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
        "callbackUrl": mobile_donate_callback_url(),
    }


def create_checkout_payload(user: User, tier: str, *, prefer_order: bool = False) -> dict:
    """Build Razorpay Checkout options for the web client."""
    if tier not in {SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.LIFETIME}:
        raise RazorpayServiceError(f"Unsupported tier '{tier}'.")

    if prefer_order or not _subscription_available_for_tier(tier):
        return _create_order_checkout(user, tier)

    client = _client()
    site_url = settings.WEB_BASE_URL.rstrip("/")
    prefill = {
        "email": user.email or "",
        "name": user.display_name or user.email or "",
    }

    try:
        subscription = client.subscription.create(
            {
                "plan_id": _plan_id_for_tier(tier),
                "customer_notify": 1,
                "total_count": settings.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT,
                "notes": _user_notes(user, tier),
            }
        )
    except Exception:
        logger.warning(
            "Razorpay subscription checkout failed for tier %s; falling back to order checkout.",
            tier,
            exc_info=True,
        )
        return _create_order_checkout(user, tier)
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


def _assert_payment_user(user: User | None, expected_user: User | None) -> User:
    if user is None:
        raise RazorpayServiceError("Unable to resolve user for completed payment.")
    if expected_user is not None and user.id != expected_user.id:
        raise RazorpayServiceError("This payment belongs to a different account.")
    return user


def verify_checkout_signature(payload: dict, *, expected_user: User | None = None) -> User | None:
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
        user = _assert_payment_user(_resolve_user_from_notes(notes), expected_user)
        tier = _resolve_tier_from_notes(notes, order_amount=order.get("amount"))
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
        user = _assert_payment_user(_resolve_user_from_notes(notes), expected_user)
        tier = str(notes.get("tier") or "").strip().lower()
        if tier not in {SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.LIFETIME}:
            tier = _tier_for_plan_id(subscription.get("plan_id", ""))
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
    """Downgrade to free — cancel recurring billing or end a one-time order entitlement."""
    entitlement = _get_or_create_entitlement(user)
    effective = entitlement.effective_tier

    if effective == SubscriptionTier.FREE:
        return {
            "status": "already_free",
            "message": "You are already on the free plan.",
        }

    if effective == SubscriptionTier.LIFETIME:
        raise RazorpayServiceError(
            "Lifetime memberships cannot be cancelled online. Contact support if you need help."
        )

    if entitlement.razorpay_subscription_id:
        client = _client()
        client.subscription.cancel(
            entitlement.razorpay_subscription_id,
            {"cancel_at_cycle_end": 1},
        )
        entitlement.will_renew = False
        entitlement.save(update_fields=["will_renew", "updated_at"])
        return {
            "status": "cancel_scheduled",
            "message": (
                "Your subscription will not renew. You keep your current plan until "
                "the end of this billing period, then move to Free."
            ),
        }

    entitlement.tier = SubscriptionTier.FREE
    entitlement.will_renew = False
    entitlement.expires_at = None
    entitlement.save(update_fields=["tier", "will_renew", "expires_at", "updated_at"])
    return {
        "status": "downgraded",
        "message": "You are now on the free plan.",
    }


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
    try:
        tier = _resolve_tier_from_notes(notes, order_amount=payment.get("amount"))
    except RazorpayServiceError:
        logger.warning("Razorpay payment.captured without valid tier: %s", payment.get("id"))
        return None
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
