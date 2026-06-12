from django.urls import include, path
from health.views import RootWelcomeView

app_name = "api"

urlpatterns = [
    path("", RootWelcomeView.as_view(), name="api-root"),
    path("mobile/v1/", include(("users.urls", "users"), namespace="users")),
    path(
        "mobile/v1/onboarding/",
        include(("onboarding.urls", "onboarding"), namespace="onboarding"),
    ),
    path("mobile/v1/", include(("mobileapi.urls", "mobileapi"), namespace="v1")),
    path("billing/v1/", include(("billing.urls", "billing"), namespace="billing-v1")),
    path("public/v1/", include(("publicapi.urls", "publicapi"), namespace="public-v1")),
]
