from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", include("health.urls")),
    path("api/mobile/", include("users.urls")),
    path("api/mobile/onboarding/", include("onboarding.urls")),
    path("api/mobile/v1/", include("mobileapi.urls")),
]
