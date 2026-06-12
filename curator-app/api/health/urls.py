from django.urls import path

from health.views import HealthView, LivenessView

app_name = "health"

urlpatterns = [
    path("", HealthView.as_view(), name="health"),
    path("live/", LivenessView.as_view(), name="health-live"),
]
