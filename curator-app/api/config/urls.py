from django.contrib import admin
from django.urls import include, path
from health.views import RootWelcomeView

urlpatterns = [
    path("", RootWelcomeView.as_view(), name="root"),
    path("admin/", admin.site.urls),
    path("health/", include(("health.urls", "health"), namespace="health")),
    path("api/", include(("config.api_urls", "api"), namespace="api")),
]
