from rest_framework import serializers

from common.constants import CATEGORY_KEYS
from onboarding.models import (
    NotificationFrequency,
    TextSize,
    ThemePreference,
    UserPreference,
)


class OnboardingProfileSerializer(serializers.Serializer):
    displayName = serializers.CharField(max_length=120)


class OnboardingCategorySerializer(serializers.Serializer):
    categories = serializers.ListField(
        child=serializers.ChoiceField(choices=sorted(CATEGORY_KEYS)),
        allow_empty=False,
    )

    def validate_categories(self, value):
        unique_categories = list(dict.fromkeys(value))
        if len(unique_categories) < 3:
            raise serializers.ValidationError("Select at least 3 categories.")
        return unique_categories


class OnboardingPreferenceSerializer(serializers.Serializer):
    themePreference = serializers.ChoiceField(choices=ThemePreference.values)
    notificationFrequency = serializers.ChoiceField(choices=NotificationFrequency.values)
    pushEnabled = serializers.BooleanField()
    emailDigestEnabled = serializers.BooleanField()
    autoSaveEnabled = serializers.BooleanField()
    textSize = serializers.ChoiceField(choices=TextSize.values)
    reduceMotionEnabled = serializers.BooleanField()
    skipNotifications = serializers.BooleanField(required=False, default=False)

    def update_preferences(self, instance: UserPreference):
        data = self.validated_data
        instance.theme_preference = data["themePreference"]
        instance.notification_frequency = data["notificationFrequency"]
        instance.push_enabled = data["pushEnabled"]
        instance.email_digest_enabled = data["emailDigestEnabled"]
        instance.auto_save_enabled = data["autoSaveEnabled"]
        instance.text_size = data["textSize"]
        instance.reduce_motion_enabled = data["reduceMotionEnabled"]
        instance.save()
        return instance
