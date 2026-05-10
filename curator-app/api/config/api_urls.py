from django.urls import include, path


app_name = "api"

urlpatterns = [
    path("mobile/", include(("users.urls", "users"), namespace="users")),
    path(
        "mobile/onboarding/",
        include(("onboarding.urls", "onboarding"), namespace="onboarding"),
    ),
    path("mobile/v1/", include(("mobileapi.urls", "mobileapi"), namespace="v1")),
]
