import logging

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from billing import stripe_service
from billing.stripe_service import StripeNotConfigured, StripeServiceError
from mobileapi.models import SubscriptionTier

logger = logging.getLogger(__name__)


class CheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tier = str(request.data.get("tier", "")).strip().lower()
        if tier not in {
            SubscriptionTier.BASIC,
            SubscriptionTier.PREMIUM,
            SubscriptionTier.LIFETIME,
        }:
            return Response(
                {"detail": "tier must be one of: basic, premium, lifetime."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            url = stripe_service.create_checkout_session(request.user, tier)
        except StripeNotConfigured:
            return Response(
                {"detail": "Payments are not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except StripeServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Stripe checkout session creation failed")
            return Response(
                {"detail": "Unable to start checkout."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"url": url})


class PortalSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            url = stripe_service.create_portal_session(request.user)
        except StripeNotConfigured:
            return Response(
                {"detail": "Payments are not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except StripeServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Stripe portal session creation failed")
            return Response(
                {"detail": "Unable to open billing portal."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({"url": url})


class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "webhooks"

    def post(self, request):
        signature = request.headers.get("Stripe-Signature", "")
        try:
            event = stripe_service.verify_webhook(request.body, signature)
        except StripeNotConfigured:
            return Response(status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            logger.warning("Rejected Stripe webhook with invalid signature")
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            stripe_service.process_stripe_webhook(event)
        except Exception:
            logger.exception("Failed to process Stripe webhook %s", event.get("id"))
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"received": True})
