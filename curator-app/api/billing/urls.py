from django.conf import settings
from django.urls import path

from billing.views import (
    CheckoutSessionView,
    CreateOrderView,
    MobileHandoffCreateView,
    MobileHandoffExchangeView,
    PortalSessionView,
    RazorpayWebhookView,
    StripeWebhookView,
    VerifyCheckoutView,
    VerifyPaymentView,
)

app_name = "billing"

urlpatterns = [
    path("checkout/", CheckoutSessionView.as_view(), name="checkout"),
    path("create-order/", CreateOrderView.as_view(), name="create-order"),
    path("verify/", VerifyCheckoutView.as_view(), name="verify"),
    path("verify-payment/", VerifyPaymentView.as_view(), name="verify-payment"),
    path("mobile-handoff/", MobileHandoffCreateView.as_view(), name="mobile-handoff"),
    path("mobile-handoff/exchange/", MobileHandoffExchangeView.as_view(), name="mobile-handoff-exchange"),
    path("portal/", PortalSessionView.as_view(), name="portal"),
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("webhooks/razorpay/", RazorpayWebhookView.as_view(), name="razorpay-webhook"),
]
