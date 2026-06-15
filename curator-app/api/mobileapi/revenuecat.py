import logging
from datetime import UTC, datetime
from uuid import UUID

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from mobileapi.models import RevenueCatWebhookEvent, SubscriptionTier, UserEntitlement
from users.models import User


logger = logging.getLogger(__name__)

TIER_RANK = {
    SubscriptionTier.FREE: 0,
    SubscriptionTier.BASIC: 1,
    SubscriptionTier.PREMIUM: 2,
    SubscriptionTier.LIFETIME: 3,
}

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
        return datetime.fromtimestamp(int(value) / 1000, tz=UTC)
    except (TypeError, ValueError, OSError):
        return None


def _higher_tier(current: str, candidate: str) -> str:
    if TIER_RANK.get(candidate, 0) > TIER_RANK.get(current, 0):
        return candidate
    return current


def _resolve_tier_from_product_id(product_id: str):
    if not product_id:
        return SubscriptionTier.FREE

    configured_map = getattr(settings, "REVENUECAT_PRODUCT_TIER_MAP", {}) or {}
    if product_id in configured_map:
        return configured_map[product_id]

    # Split into exact tokens by standard separators to avoid loose substring mismatches
    tokens = set(product_id.lower().replace(".", "_").replace("-", "_").split("_"))
    if "lifetime" in tokens:
        return SubscriptionTier.LIFETIME
    if "premium" in tokens:
        return SubscriptionTier.PREMIUM
    if "basic" in tokens:
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
        try:
            user = User.objects.filter(id=UUID(candidate)).first()
        except (TypeError, ValueError):
            user = None
        if user:
            return user, candidate

    return None, next(iter(candidates), "")


def _resolve_tier_from_revenuecat_active_entitlements(active_entitlements):
    resolved = SubscriptionTier.FREE
    for entitlement_key, entitlement_data in (active_entitlements or {}).items():
        product_id = (entitlement_data or {}).get("product_identifier") or ""
        tier = _resolve_tier_from_product_id(product_id)
        if tier == SubscriptionTier.FREE:
            tier = _resolve_tier_from_product_id(entitlement_key)
        resolved = _higher_tier(resolved, tier)
    return resolved


def refresh_entitlement_from_revenuecat(user, entitlement: UserEntitlement) -> UserEntitlement:
    """Best-effort sync when webhooks lag behind the mobile RevenueCat SDK."""
    api_key = getattr(settings, "REVENUECAT_API_KEY", "")
    if not api_key or entitlement.qa_override_enabled:
        return entitlement

    app_user_id = user.firebase_uid or str(user.id)
    try:
        response = requests.get(
            f"https://api.revenuecat.com/v1/subscribers/{app_user_id}",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10,
        )
    except requests.RequestException:
        logger.warning("RevenueCat subscriber lookup failed for user %s.", user.id, exc_info=True)
        return entitlement

    if response.status_code != 200:
        return entitlement

    payload = response.json()
    subscriber = payload.get("subscriber") or {}
    active_entitlements = (subscriber.get("entitlements") or {}).get("active") or {}
    resolved_tier = _resolve_tier_from_revenuecat_active_entitlements(active_entitlements)
    if resolved_tier == SubscriptionTier.FREE:
        return entitlement

    latest_expiration = None
    latest_product_id = ""
    for entitlement_key, entitlement_data in active_entitlements.items():
        product_id = (entitlement_data or {}).get("product_identifier") or entitlement_key
        tier = _resolve_tier_from_product_id(product_id)
        if tier == SubscriptionTier.FREE:
            tier = _resolve_tier_from_product_id(entitlement_key)
        if tier != resolved_tier:
            continue
        expires_raw = (entitlement_data or {}).get("expires_date")
        expires_at = parse_datetime(expires_raw) if expires_raw else None
        if expires_at and (latest_expiration is None or expires_at > latest_expiration):
            latest_expiration = expires_at
            latest_product_id = product_id

    update_fields = ["updated_at"]
    if TIER_RANK[resolved_tier] > TIER_RANK.get(entitlement.tier, 0):
        entitlement.tier = resolved_tier
        update_fields.append("tier")
    if latest_product_id:
        entitlement.product_id = latest_product_id
        update_fields.append("product_id")
    if latest_expiration is not None:
        entitlement.expires_at = latest_expiration
        entitlement.will_renew = resolved_tier != SubscriptionTier.LIFETIME
        update_fields.extend(["expires_at", "will_renew"])
    if subscriber.get("original_app_user_id"):
        entitlement.revenuecat_customer_id = subscriber["original_app_user_id"]
        update_fields.append("revenuecat_customer_id")

    if len(update_fields) > 1:
        entitlement.save(update_fields=update_fields)

    return entitlement


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
