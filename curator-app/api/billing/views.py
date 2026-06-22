import logging



from rest_framework import status

from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_framework.response import Response

from rest_framework.throttling import ScopedRateThrottle

from rest_framework.views import APIView



from billing import razorpay_service, stripe_service

from billing.payments import get_web_billing_provider

from billing.razorpay_service import RazorpayNotConfigured, RazorpayServiceError

from billing.stripe_service import StripeNotConfigured, StripeServiceError

from mobileapi.models import SubscriptionTier



logger = logging.getLogger(__name__)



_ALLOWED_TIERS = {

    SubscriptionTier.BASIC,

    SubscriptionTier.PREMIUM,

    SubscriptionTier.LIFETIME,

}





class CheckoutSessionView(APIView):

    permission_classes = [IsAuthenticated]



    def post(self, request):

        tier = str(request.data.get("tier", "")).strip().lower()

        if tier not in _ALLOWED_TIERS:

            return Response(

                {"detail": "tier must be one of: basic, premium, lifetime."},

                status=status.HTTP_400_BAD_REQUEST,

            )



        provider = get_web_billing_provider()

        if provider is None:

            return Response(

                {"detail": "Payments are not configured."},

                status=status.HTTP_503_SERVICE_UNAVAILABLE,

            )



        try:

            if provider == "razorpay":

                payload = razorpay_service.create_checkout_payload(request.user, tier)

                return Response(payload)



            url = stripe_service.create_checkout_session(request.user, tier)

            return Response({"provider": "stripe", "url": url})

        except (RazorpayNotConfigured, StripeNotConfigured):

            return Response(

                {"detail": "Payments are not configured."},

                status=status.HTTP_503_SERVICE_UNAVAILABLE,

            )

        except (RazorpayServiceError, StripeServiceError) as exc:

            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception:

            logger.exception("Checkout session creation failed")

            return Response(

                {"detail": "Unable to start checkout."},

                status=status.HTTP_502_BAD_GATEWAY,

            )





class VerifyCheckoutView(APIView):

    """Razorpay client callback verification (webhook remains source of truth)."""



    permission_classes = [IsAuthenticated]



    def post(self, request):

        if get_web_billing_provider() != "razorpay":

            return Response(

                {"detail": "Verification is only used for Razorpay checkout."},

                status=status.HTTP_400_BAD_REQUEST,

            )

        try:

            razorpay_service.verify_checkout_signature(request.data, expected_user=request.user)

        except RazorpayNotConfigured:

            return Response(

                {"detail": "Payments are not configured."},

                status=status.HTTP_503_SERVICE_UNAVAILABLE,

            )

        except RazorpayServiceError as exc:

            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception:

            logger.exception("Razorpay checkout verification failed")

            return Response(

                {"detail": "Unable to verify payment."},

                status=status.HTTP_502_BAD_GATEWAY,

            )

        return Response({"verified": True})





class PortalSessionView(APIView):

    permission_classes = [IsAuthenticated]



    def post(self, request):

        provider = get_web_billing_provider()

        if provider == "razorpay":

            try:

                result = razorpay_service.cancel_subscription(request.user)

                return Response({"provider": "razorpay", **result})

            except RazorpayNotConfigured:

                return Response(

                    {"detail": "Payments are not configured."},

                    status=status.HTTP_503_SERVICE_UNAVAILABLE,

                )

            except RazorpayServiceError as exc:

                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            except Exception:

                logger.exception("Razorpay subscription cancel failed")

                return Response(

                    {"detail": "Unable to update subscription."},

                    status=status.HTTP_502_BAD_GATEWAY,

                )



        try:

            url = stripe_service.create_portal_session(request.user)

            return Response({"provider": "stripe", "url": url})

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




class CreateOrderView(APIView):
    """Razorpay Standard Checkout — POST /api/create-order."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        tier = str(request.data.get("tier", "")).strip().lower()
        try:
            if tier in _ALLOWED_TIERS:
                checkout = razorpay_service.create_checkout_payload(request.user, tier)
                if checkout.get("mode") != "order":
                    return Response(
                        {"detail": "Subscription checkout is not supported on this endpoint."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                return Response(
                    {
                        "order_id": checkout["orderId"],
                        "amount": checkout["amount"],
                        "currency": checkout["currency"],
                        "key_id": checkout["keyId"],
                    }
                )

            amount = int(request.data.get("amount", 0))
            currency = str(request.data.get("currency") or "").strip() or None
            receipt = str(request.data.get("receipt") or "")
            notes = request.data.get("notes") if isinstance(request.data.get("notes"), dict) else {}
            tier = str(notes.get("tier") or request.data.get("tier") or "").strip().lower()
            if tier not in _ALLOWED_TIERS:
                return Response(
                    {"detail": "tier is required for custom orders (basic, premium, or lifetime)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            expected_amount = (
                razorpay_service._lifetime_amount()
                if tier == SubscriptionTier.LIFETIME
                else razorpay_service._amount_for_tier(tier)
            )
            if amount != expected_amount:
                return Response(
                    {"detail": f"amount must be {expected_amount} paise for tier '{tier}'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            notes = {**notes, "user_id": str(request.user.id), "tier": tier}
            order = razorpay_service.create_standard_order(
                amount=amount,
                currency=currency,
                receipt=receipt,
                notes=notes,
            )
            return Response(order)
        except (TypeError, ValueError):
            return Response(
                {"detail": "amount must be a valid integer (minimum 100 paise)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except RazorpayNotConfigured:
            return Response(
                {"detail": "Payments are not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except RazorpayServiceError as exc:
            detail = str(exc)
            code = status.HTTP_401_UNAUTHORIZED if "authentication" in detail.lower() else status.HTTP_400_BAD_REQUEST
            return Response({"detail": detail}, status=code)
        except Exception:
            logger.exception("Razorpay create-order failed")
            return Response(
                {"detail": "Unable to create order."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VerifyPaymentView(APIView):
    """Razorpay Standard Checkout — POST /api/verify-payment."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("razorpay_order_id")
        payment_id = request.data.get("razorpay_payment_id")
        signature = request.data.get("razorpay_signature")

        if not order_id or not payment_id or not signature:
            return Response(
                {"detail": "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            razorpay_service.verify_checkout_signature(request.data, expected_user=request.user)
        except RazorpayNotConfigured:
            return Response(
                {"detail": "Payments are not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except RazorpayServiceError as exc:
            return Response({"detail": str(exc), "success": False}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Razorpay verify-payment failed")
            return Response(
                {"detail": "Unable to verify payment.", "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"success": True, "verified": True})




class MobileHandoffCreateView(APIView):

    permission_classes = [IsAuthenticated]



    def post(self, request):

        plan = str(request.data.get("plan", "")).strip().lower() or None

        try:

            from billing import handoff

            payload = handoff.build_mobile_donate_handoff(request.user, plan)

        except RazorpayServiceError as exc:

            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(payload)




class MobileHandoffExchangeView(APIView):

    authentication_classes = []

    permission_classes = [AllowAny]

    throttle_classes = [ScopedRateThrottle]

    throttle_scope = "webhooks"



    def post(self, request):

        token = str(request.data.get("handoffToken", "")).strip()

        try:

            from billing import handoff

            custom_token = handoff.exchange_mobile_handoff(token)

        except RazorpayServiceError as exc:

            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"customToken": custom_token})




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





class RazorpayWebhookView(APIView):

    authentication_classes = []

    permission_classes = [AllowAny]

    throttle_classes = [ScopedRateThrottle]

    throttle_scope = "webhooks"



    def post(self, request):

        signature = request.headers.get("X-Razorpay-Signature", "")

        try:

            event = razorpay_service.verify_webhook(request.body, signature)

        except RazorpayNotConfigured:

            return Response(status=status.HTTP_503_SERVICE_UNAVAILABLE)

        except Exception:

            logger.warning("Rejected Razorpay webhook with invalid signature")

            return Response(status=status.HTTP_400_BAD_REQUEST)



        try:

            razorpay_service.process_razorpay_webhook(event)

        except Exception:

            logger.exception("Failed to process Razorpay webhook %s", event.get("event"))

            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"received": True})


