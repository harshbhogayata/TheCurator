import logging
from datetime import datetime

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from mobileapi.models import RevenueCatWebhookEvent, SubscriptionTier, UserEntitlement
from users.models import User


logger = logging.getLogger(__name__)

ACTIVE_EVENT_TYPES = {
    "INITIAL_PURCHASE",
    "RENEWAL",
    "NON_RENEWING_PURCHASE",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
}
NO_RENEW_EVENT_TYPES = {"CANCELLATION", "BILLING_ISSUE"}
EXPIRED_EVENT_TYPES = {"EXPIRATION"}


def _event_datetime_from_ms(value):
    if not value:
        return None
    try:
        return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def _resolve_tier_from_product_id(product_id: str):
    if not product_id:
        return SubscriptionTier.FREE

    configured_map = getattr(settings, "REVENUECAT_PRODUCT_TIER_MAP", {}) or {}
    if product_id in configured_map:
        return configured_map[product_id]

    normalized = product_id.lower()
    if "lifetime" in normalized:
        return SubscriptionTier.LIFETIME
    if "premium" in normalized:
        return SubscriptionTier.PREMIUM
    if "basic" in normalized:
        return SubscriptionTier.BASIC
    return SubscriptionTier.FREE


def _resolve_user_from_event(event):
    candidates = []
    for field in ("app_user_id", "original_app_user_id"):
        value = event.get(field)
        if value:
            candidates.append(value)

    for alias in event.get("aliases", []) or []:
        if alias:
            candidates.append(alias)

    seen = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        user = User.objects.filter(firebase_uid=candidate).first()
        if user:
            return user, candidate

    return None, next(iter(candidates), "")


def _apply_entitlement_event(entitlement: UserEntitlement, event):
    event_type = (event.get("type") or "").upper()
    product_id = event.get("product_id", "") or ""
    resolved_tier = _resolve_tier_from_product_id(product_id)
    expiration_at = _event_datetime_from_ms(event.get("expiration_at_ms"))
    app_user_id = event.get("app_user_id") or event.get("original_app_user_id") or ""

    if app_user_id:
        entitlement.revenuecat_customer_id = app_user_id

    if event_type in ACTIVE_EVENT_TYPES:
        if resolved_tier != SubscriptionTier.FREE or event_type == "NON_RENEWING_PURCHASE":
            entitlement.tier = resolved_tier
        entitlement.product_id = product_id
        entitlement.expires_at = expiration_at
        entitlement.will_renew = (
            event_type != "NON_RENEWING_PURCHASE" and resolved_tier != SubscriptionTier.LIFETIME
        )
    elif event_type in NO_RENEW_EVENT_TYPES:
        if product_id:
            entitlement.product_id = product_id
        if expiration_at:
            entitlement.expires_at = expiration_at
        entitlement.will_renew = False
    elif event_type in EXPIRED_EVENT_TYPES:
        entitlement.tier = SubscriptionTier.FREE
        entitlement.product_id = ""
        entitlement.expires_at = expiration_at
        entitlement.will_renew = False
    else:
        logger.info("RevenueCat webhook event %s does not modify entitlements directly.", event_type)

    entitlement.save()


@transaction.atomic
def process_revenuecat_webhook(payload):
    event = payload.get("event") if isinstance(payload, dict) and "event" in payload else payload
    if not isinstance(event, dict):
        raise ValueError("RevenueCat webhook payload must contain an event object.")

    event_id = event.get("id")
    event_type = event.get("type")
    if not event_id or not event_type:
        raise ValueError("RevenueCat webhook payload is missing required event identifiers.")

    existing = RevenueCatWebhookEvent.objects.filter(event_id=event_id).first()
    if existing:
        return existing, False

    user, matched_app_user_id = _resolve_user_from_event(event)
    webhook_event = RevenueCatWebhookEvent.objects.create(
        event_id=event_id,
        event_type=event_type,
        app_user_id=matched_app_user_id or event.get("app_user_id", "") or "",
        store=event.get("store", "") or "",
        environment=event.get("environment", "") or "",
        payload=payload if isinstance(payload, dict) else {"event": event},
        user=user,
    )

    if user:
        entitlement, _ = UserEntitlement.objects.get_or_create(user=user)
        _apply_entitlement_event(entitlement, event)

    return webhook_event, True
