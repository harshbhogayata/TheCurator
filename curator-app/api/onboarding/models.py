from django.conf import settings
from django.db import models

from common.constants import CATEGORY_OPTIONS
from common.models import UUIDPrimaryKeyModel, TimestampedModel


class OnboardingStep(models.TextChoices):
    ACCOUNT = "account", "Account"
    CATEGORIES = "categories", "Categories"
    APPEARANCE = "appearance", "Appearance"
    NOTIFICATIONS = "notifications", "Notifications"
    READING = "reading", "Reading"
    COMPLETE = "complete", "Complete"


class ThemePreference(models.TextChoices):
    LIGHT = "light", "Light"
    DARK = "dark", "Dark"
    SYSTEM = "system", "System"


class NotificationFrequency(models.TextChoices):
    DAILY = "daily", "Daily"
    BREAKING = "breaking", "Breaking"
    WEEKLY = "weekly", "Weekly"
    NONE = "none", "None"


class TextSize(models.TextChoices):
    COMPACT = "compact", "Compact"
    COMFORTABLE = "comfortable", "Comfortable"
    LARGE = "large", "Large"


class UserOnboarding(TimestampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="onboarding_state",
    )
    current_step = models.CharField(
        max_length=32,
        choices=OnboardingStep.choices,
        default=OnboardingStep.ACCOUNT,
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at"]


class UserPreference(TimestampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="preferences",
    )
    theme_preference = models.CharField(
        max_length=16,
        choices=ThemePreference.choices,
        default=ThemePreference.SYSTEM,
    )
    notification_frequency = models.CharField(
        max_length=16,
        choices=NotificationFrequency.choices,
        default=NotificationFrequency.DAILY,
    )
    push_enabled = models.BooleanField(default=True)
    email_digest_enabled = models.BooleanField(default=True)
    auto_save_enabled = models.BooleanField(default=True)
    text_size = models.CharField(
        max_length=16,
        choices=TextSize.choices,
        default=TextSize.COMFORTABLE,
    )
    reduce_motion_enabled = models.BooleanField(default=False)

    class Meta:
        ordering = ["-updated_at"]


class UserCategoryPreference(UUIDPrimaryKeyModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="category_preferences",
    )
    category_key = models.CharField(max_length=32, choices=CATEGORY_OPTIONS)

    class Meta:
        ordering = ["category_key"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "category_key"],
                name="onboarding_user_category_unique",
            )
        ]
