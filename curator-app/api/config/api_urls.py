from django.urls import include, path
from health.views import RootWelcomeView
from publicapi.views import LaunchNotifyView
from billing.views import CreateOrderView, VerifyPaymentView

app_name = "api"

urlpatterns = [
    path("", RootWelcomeView.as_view(), name="api-root"),
    path("launch-notify", LaunchNotifyView.as_view(), name="launch-notify"),
    # Razorpay Standard Checkout (spec aliases; also under /api/billing/v1/).
    path("create-order", CreateOrderView.as_view(), name="create-order"),
    path("verify-payment", VerifyPaymentView.as_view(), name="verify-payment"),
    # Legacy prefix kept for older deploys and zero-downtime rollouts.
    path("mobile/", include(("users.urls", "users"), namespace="users-legacy")),
    path(
        "mobile/onboarding/",
        include(("onboarding.urls", "onboarding"), namespace="onboarding-legacy"),
    ),
    path("mobile/v1/", include(("users.urls", "users"), namespace="users")),
    path(
        "mobile/v1/onboarding/",
        include(("onboarding.urls", "onboarding"), namespace="onboarding"),
    ),
    path("mobile/v1/", include(("mobileapi.urls", "mobileapi"), namespace="v1")),
    path("billing/v1/", include(("billing.urls", "billing"), namespace="billing-v1")),
    path("public/v1/", include(("publicapi.urls", "publicapi"), namespace="public-v1")),
]
