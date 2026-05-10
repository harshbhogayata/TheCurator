from django.urls import path

from onboarding.views import (
    OnboardingCategoriesView,
    OnboardingCompleteView,
    OnboardingPreferencesView,
    OnboardingProfileView,
    OnboardingStateView,
)

app_name = "onboarding"

urlpatterns = [
    path("", OnboardingStateView.as_view(), name="state"),
    path("profile", OnboardingProfileView.as_view(), name="profile"),
    path("categories", OnboardingCategoriesView.as_view(), name="categories"),
    path("preferences", OnboardingPreferencesView.as_view(), name="preferences"),
    path("complete", OnboardingCompleteView.as_view(), name="complete"),
]
