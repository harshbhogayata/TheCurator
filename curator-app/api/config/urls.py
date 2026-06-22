from django.contrib import admin
from django.urls import include, path
from health.views import RootWelcomeView
from billing.mobile_checkout import MobileDonateCallbackView, MobileDonatePageView

urlpatterns = [
    path("", RootWelcomeView.as_view(), name="root"),
    path("m/donate", MobileDonatePageView.as_view(), name="mobile-donate"),
    path("m/donate/callback", MobileDonateCallbackView.as_view(), name="mobile-donate-callback"),
    path("admin/", admin.site.urls),
    path("health/", include(("health.urls", "health"), namespace="health")),
    path("api/", include(("config.api_urls", "api"), namespace="api")),
]
