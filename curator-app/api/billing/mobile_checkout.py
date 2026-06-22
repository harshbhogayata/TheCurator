"""API-hosted mobile donate checkout (Razorpay in browser)."""

from __future__ import annotations

import json
import logging

from billing.donate_urls import mobile_donate_callback_url, mobile_donate_page_url
from django.conf import settings
from django.http import HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView

from mobileapi.models import SubscriptionTier

logger = logging.getLogger(__name__)

_ALLOWED_PLANS = {SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.LIFETIME}


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


@method_decorator(csrf_exempt, name="dispatch")
class MobileDonateCallbackView(View):
    """Razorpay POST redirect target — required for in-app browser / WebView checkout."""

    def post(self, request):
        from billing import razorpay_service
        from billing.razorpay_service import RazorpayServiceError

        payload = {
            "razorpay_payment_id": request.POST.get("razorpay_payment_id", ""),
            "razorpay_order_id": request.POST.get("razorpay_order_id", ""),
            "razorpay_signature": request.POST.get("razorpay_signature", ""),
        }
        success_url = f"{mobile_donate_page_url()}?status=success&source=app"
        failure_url = f"{mobile_donate_page_url()}?status=failed&source=app"

        try:
            razorpay_service.verify_checkout_signature(payload, expected_user=None)
        except RazorpayServiceError as exc:
            logger.warning("Mobile donate callback verification failed: %s", exc)
            return HttpResponseRedirect(failure_url)

        return HttpResponseRedirect(success_url)
