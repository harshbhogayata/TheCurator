from django.urls import path

from onboarding.views import (
    OnboardingCategoriesView,
    OnboardingCompleteView,
    OnboardingPreferencesView,
    OnboardingProfileView,
    OnboardingStateView,
)

urlpatterns = [
    path("", OnboardingStateView.as_view(), name="mobile-onboarding-state"),
    path("profile", OnboardingProfileView.as_view(), name="mobile-onboarding-profile"),
    path("categories", OnboardingCategoriesView.as_view(), name="mobile-onboarding-categories"),
    path("preferences", OnboardingPreferencesView.as_view(), name="mobile-onboarding-preferences"),
    path("complete", OnboardingCompleteView.as_view(), name="mobile-onboarding-complete"),
]
