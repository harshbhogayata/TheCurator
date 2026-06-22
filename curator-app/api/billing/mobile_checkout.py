"""API-hosted mobile donate checkout (Razorpay in browser)."""

from __future__ import annotations

import json

from django.conf import settings
from django.views.generic import TemplateView

from mobileapi.models import SubscriptionTier

_ALLOWED_PLANS = {SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.LIFETIME}


def mobile_donate_page_url() -> str:
    override = (getattr(settings, "MOBILE_DONATE_URL", "") or "").strip().rstrip("/")
    if override:
        return override
    api_base = (settings.API_PUBLIC_BASE_URL or "").strip().rstrip("/")
    if api_base:
        return f"{api_base}/m/donate"
    return f"{settings.WEB_BASE_URL.rstrip('/')}/donate"


class MobileDonatePageView(TemplateView):
    template_name = "billing/mobile_donate.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        plan = str(self.request.GET.get("plan", "premium")).strip().lower()
        if plan not in _ALLOWED_PLANS:
            plan = SubscriptionTier.PREMIUM

        project_id = settings.FIREBASE_PROJECT_ID or ""
        auth_domain = settings.FIREBASE_WEB_AUTH_DOMAIN or (
            f"{project_id}.firebaseapp.com" if project_id else ""
        )

        checkout_config = {
            "apiBase": settings.API_PUBLIC_BASE_URL or "",
            "plan": plan,
            "handoffToken": self.request.GET.get("handoff", ""),
            "autoCheckout": self.request.GET.get("auto") == "1",
            "fromApp": self.request.GET.get("source") == "app",
            "status": self.request.GET.get("status", ""),
            "razorpayKeyId": settings.RAZORPAY_KEY_ID or "",
            "firebase": {
                "apiKey": settings.FIREBASE_WEB_API_KEY or "",
                "authDomain": auth_domain,
                "projectId": project_id,
                "appId": settings.FIREBASE_WEB_APP_ID or "",
            },
        }

        context.update(
            {
                "plan": plan,
                "from_app": self.request.GET.get("source") == "app",
                "checkout_config_json": json.dumps(checkout_config),
            }
        )
        return context
