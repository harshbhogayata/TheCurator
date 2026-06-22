"""Short-lived tokens so the mobile app can open web donate already signed in."""

from __future__ import annotations

from urllib.parse import urlencode

from django.conf import settings
from django.core import signing

from billing.mobile_checkout import mobile_donate_page_url
from billing.razorpay_service import RazorpayServiceError
from mobileapi.models import SubscriptionTier
from users.models import User
from users.services.firebase import create_custom_token

HANDOFF_SALT = "billing.mobile-donate-handoff"
HANDOFF_MAX_AGE_SECONDS = 600

_ALLOWED_PLANS = {SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.LIFETIME}


def build_mobile_donate_handoff(user: User, plan: str | None = None) -> dict:
    if plan and plan not in _ALLOWED_PLANS:
        raise RazorpayServiceError("Invalid subscription plan for mobile handoff.")

    token = signing.dumps(
        {"user_id": str(user.id), "plan": plan or ""},
        salt=HANDOFF_SALT,
    )
    query: dict[str, str] = {"source": "app", "auto": "1", "handoff": token}
    if plan:
        query["plan"] = plan

    donate_url = f"{mobile_donate_page_url()}?{urlencode(query)}"

    return {
        "handoffToken": token,
        "donateUrl": donate_url,
        "expiresInSeconds": HANDOFF_MAX_AGE_SECONDS,
    }


def exchange_mobile_handoff(token: str) -> str:
    if not token:
        raise RazorpayServiceError("Missing handoff token.")

    try:
        payload = signing.loads(token, salt=HANDOFF_SALT, max_age=HANDOFF_MAX_AGE_SECONDS)
    except signing.BadSignature as exc:
        raise RazorpayServiceError("Handoff link expired or invalid.") from exc

    user_id = payload.get("user_id")
    if not user_id:
        raise RazorpayServiceError("Invalid handoff token.")

    user = User.objects.filter(id=user_id).first()
    if user is None or not user.firebase_uid:
        raise RazorpayServiceError("Unable to sign in for checkout.")

    return create_custom_token(user.firebase_uid)
