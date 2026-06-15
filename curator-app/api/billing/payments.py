"""Select the active web billing provider (Razorpay vs Stripe)."""

from django.conf import settings


def get_web_billing_provider() -> str | None:
    """Return 'razorpay', 'stripe', or None when web checkout is unavailable."""
    explicit = (settings.WEB_BILLING_PROVIDER or "").strip().lower()
    if explicit == "razorpay":
        return "razorpay" if _razorpay_configured() else None
    if explicit == "stripe":
        return "stripe" if _stripe_configured() else None

    if _razorpay_configured():
        return "razorpay"
    if _stripe_configured():
        return "stripe"
    return None


def _razorpay_configured() -> bool:
    return bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)


def _stripe_configured() -> bool:
    return bool(settings.STRIPE_SECRET_KEY)
