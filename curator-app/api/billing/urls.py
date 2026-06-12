from django.urls import path

from billing.views import CheckoutSessionView, PortalSessionView, StripeWebhookView

app_name = "billing"

urlpatterns = [
    path("checkout/", CheckoutSessionView.as_view(), name="checkout"),
    path("portal/", PortalSessionView.as_view(), name="portal"),
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
