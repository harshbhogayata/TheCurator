import logging

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, response, views

logger = logging.getLogger(__name__)

from onboarding.models import OnboardingStep, UserCategoryPreference, UserOnboarding, UserPreference
from onboarding.serializers import (
    OnboardingCategorySerializer,
    OnboardingPreferenceSerializer,
    OnboardingProfileSerializer,
)
from users.serializers import SessionSerializer


def _state_for(user):
    onboarding_state, _ = UserOnboarding.objects.get_or_create(user=user)
    preferences, _ = UserPreference.objects.get_or_create(user=user)
    return onboarding_state, preferences


def _advance_preferences_step(onboarding_state: UserOnboarding, skip_notifications: bool = False):
    if onboarding_state.current_step == OnboardingStep.APPEARANCE:
        onboarding_state.current_step = (
            OnboardingStep.READING if skip_notifications else OnboardingStep.NOTIFICATIONS
        )
    elif onboarding_state.current_step == OnboardingStep.NOTIFICATIONS:
        onboarding_state.current_step = OnboardingStep.READING
    else:
        logger.warning(
            "Unexpected onboarding step in _advance_preferences_step: %s",
            onboarding_state.current_step,
        )


class OnboardingStateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reads"

    def get(self, request):
        return response.Response(SessionSerializer(request.user).data)


class OnboardingProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "writes"

    def patch(self, request):
        serializer = OnboardingProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request.user.display_name = serializer.validated_data["displayName"].strip()
        request.user.save(update_fields=["display_name", "updated_at"])

        onboarding_state, _ = _state_for(request.user)
        if not onboarding_state.is_completed:
            onboarding_state.current_step = OnboardingStep.CATEGORIES
            onboarding_state.save(update_fields=["current_step", "updated_at"])

        return response.Response(SessionSerializer(request.user).data)


class OnboardingCategoriesView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "writes"

    @transaction.atomic
    def patch(self, request):
        serializer = OnboardingCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        UserCategoryPreference.objects.filter(user=request.user).delete()
        UserCategoryPreference.objects.bulk_create(
            [
                UserCategoryPreference(user=request.user, category_key=category)
                for category in serializer.validated_data["categories"]
            ]
        )

        onboarding_state, _ = _state_for(request.user)
        if not onboarding_state.is_completed:
            onboarding_state.current_step = OnboardingStep.APPEARANCE
            onboarding_state.save(update_fields=["current_step", "updated_at"])

        return response.Response(SessionSerializer(request.user).data)


class OnboardingPreferencesView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "writes"

    def patch(self, request):
        serializer = OnboardingPreferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        onboarding_state, preferences = _state_for(request.user)
        serializer.update_preferences(preferences)
        skip_notifications = serializer.validated_data.get("skipNotifications", False)

        if not onboarding_state.is_completed:
            _advance_preferences_step(onboarding_state, skip_notifications=skip_notifications)
            onboarding_state.save(update_fields=["current_step", "updated_at"])

        return response.Response(SessionSerializer(request.user).data)


class OnboardingCompleteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "writes"

    def post(self, request):
        onboarding_state, _ = _state_for(request.user)
        selected_count = UserCategoryPreference.objects.filter(user=request.user).count()

        if not request.user.display_name.strip():
            return response.Response(
                {"detail": "Display name is required before onboarding can complete."},
                status=400,
            )

        if selected_count < 3:
            return response.Response(
                {"detail": "Select at least 3 categories before finishing onboarding."},
                status=400,
            )

        onboarding_state.current_step = OnboardingStep.COMPLETE
        onboarding_state.is_completed = True
        onboarding_state.completed_at = onboarding_state.completed_at or timezone.now()
        onboarding_state.save(update_fields=["current_step", "is_completed", "completed_at", "updated_at"])

        return response.Response(SessionSerializer(request.user).data)
