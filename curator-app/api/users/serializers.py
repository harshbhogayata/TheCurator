from rest_framework import serializers

from onboarding.models import UserCategoryPreference, UserOnboarding, UserPreference
from users.models import User, UserIdentity


class UserProfileSerializer(serializers.ModelSerializer):
    displayName = serializers.SerializerMethodField()
    avatarUrl = serializers.SerializerMethodField()
    memberSince = serializers.DateTimeField(source="member_since")

    class Meta:
        model = User
        fields = ("id", "email", "displayName", "avatarUrl", "memberSince")

    def get_displayName(self, obj):
        return obj.display_name or None

    def get_avatarUrl(self, obj):
        return obj.avatar_url or None


class UserIdentitySerializer(serializers.ModelSerializer):
    providerEmail = serializers.SerializerMethodField()
    providerUid = serializers.SerializerMethodField()

    class Meta:
        model = UserIdentity
        fields = ("provider", "providerEmail", "providerUid")

    def get_providerEmail(self, obj):
        return obj.provider_email or None

    def get_providerUid(self, obj):
        return obj.provider_uid or None


class UserPreferencesSerializer(serializers.ModelSerializer):
    themePreference = serializers.CharField(source="theme_preference")
    notificationFrequency = serializers.CharField(source="notification_frequency")
    pushEnabled = serializers.BooleanField(source="push_enabled")
    emailDigestEnabled = serializers.BooleanField(source="email_digest_enabled")
    autoSaveEnabled = serializers.BooleanField(source="auto_save_enabled")
    textSize = serializers.CharField(source="text_size")
    reduceMotionEnabled = serializers.BooleanField(source="reduce_motion_enabled")

    class Meta:
        model = UserPreference
        fields = (
            "themePreference",
            "notificationFrequency",
            "pushEnabled",
            "emailDigestEnabled",
            "autoSaveEnabled",
            "textSize",
            "reduceMotionEnabled",
        )


class UserOnboardingSerializer(serializers.ModelSerializer):
    currentStep = serializers.CharField(source="current_step")
    isCompleted = serializers.BooleanField(source="is_completed")
    completedAt = serializers.DateTimeField(source="completed_at", allow_null=True)
    selectedCategories = serializers.SerializerMethodField()

    class Meta:
        model = UserOnboarding
        fields = ("currentStep", "isCompleted", "completedAt", "selectedCategories")

    def get_selectedCategories(self, obj):
        return list(
            UserCategoryPreference.objects.filter(user=obj.user)
            .order_by("category_key")
            .values_list("category_key", flat=True)
        )


class SessionSerializer(serializers.Serializer):
    user = serializers.SerializerMethodField()
    onboarding = serializers.SerializerMethodField()
    preferences = serializers.SerializerMethodField()
    identities = serializers.SerializerMethodField()

    def get_user(self, user: User):
        return UserProfileSerializer(user).data

    def get_onboarding(self, user: User):
        onboarding, _ = UserOnboarding.objects.get_or_create(user=user)
        return UserOnboardingSerializer(onboarding).data

    def get_preferences(self, user: User):
        preferences, _ = UserPreference.objects.get_or_create(user=user)
        return UserPreferencesSerializer(preferences).data

    def get_identities(self, user: User):
        identities = user.identities.all().order_by("provider")
        return UserIdentitySerializer(identities, many=True).data


class AccountUpdateSerializer(serializers.ModelSerializer):
    displayName = serializers.CharField(source="display_name", max_length=80, required=False)

    class Meta:
        model = User
        fields = ("displayName",)

    def validate_displayName(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError("This field may not be blank.")
        return trimmed
