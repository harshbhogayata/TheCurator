from django.contrib import admin
from django.urls import include, path
from health.views import RootWelcomeView
from billing.mobile_checkout import MobileDonateCallbackView, MobileDonatePageView
from users.mobile_auth_pages import MobileResetPasswordPageView, MobileVerifyEmailPageView

urlpatterns = [
    path("", RootWelcomeView.as_view(), name="root"),
    path("m/donate", MobileDonatePageView.as_view(), name="mobile-donate"),
    path("m/donate/callback", MobileDonateCallbackView.as_view(), name="mobile-donate-callback"),
    path("m/reset-password", MobileResetPasswordPageView.as_view(), name="mobile-reset-password"),
    path("m/verify-email", MobileVerifyEmailPageView.as_view(), name="mobile-verify-email"),
    path("admin/", admin.site.urls),
    path("health/", include(("health.urls", "health"), namespace="health")),
    path("api/", include(("config.api_urls", "api"), namespace="api")),
]
