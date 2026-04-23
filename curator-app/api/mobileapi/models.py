from django.conf import settings
from django.db import models
from django.utils import timezone

from common.models import UUIDPrimaryKeyModel


class SubscriptionTier(models.TextChoices):
    FREE = "free", "Free"
    BASIC = "basic", "Basic"
    PREMIUM = "premium", "Premium"
    LIFETIME = "lifetime", "Lifetime"


def _today():
    return timezone.localdate()


class Article(UUIDPrimaryKeyModel):
    title = models.CharField(max_length=240)
    excerpt = models.TextField()
    category = models.CharField(max_length=64)
    read_time_minutes = models.PositiveSmallIntegerField(default=5)
    published_at = models.DateField(default=_today)
    author = models.CharField(max_length=140)
    sources = models.JSONField(default=list, blank=True)
    image_query = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)
    audio_url = models.URLField(blank=True)
    audio_duration_sec = models.PositiveIntegerField(null=True, blank=True)
    rank = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-published_at", "rank", "-created_at"]

    def __str__(self):
        return self.title


class Brief(UUIDPrimaryKeyModel):
    title = models.CharField(max_length=240)
    summary = models.TextField()
    duration_minutes = models.PositiveSmallIntegerField(default=10)
    published_at = models.DateField(default=_today)
    category = models.CharField(max_length=64, default="Daily Brief")
    image_url = models.URLField(blank=True)
    audio_url = models.URLField(blank=True)
    insights = models.PositiveSmallIntegerField(default=0)
    rank = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-published_at", "rank", "-created_at"]

    def __str__(self):
        return self.title


class UserSavedArticle(UUIDPrimaryKeyModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_articles",
    )
    article = models.ForeignKey(
        "mobileapi.Article",
        on_delete=models.CASCADE,
        related_name="saved_by",
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "article"],
                name="mobileapi_saved_user_article_unique",
            )
        ]

    def __str__(self):
        return f"{self.user} saved {self.article}"


class UserCollection(UUIDPrimaryKeyModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mobile_collections",
    )
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=16, default="#6366f1")
    icon = models.CharField(max_length=64, default="folder")

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user} · {self.name}"


class UserCollectionArticle(UUIDPrimaryKeyModel):
    collection = models.ForeignKey(
        "mobileapi.UserCollection",
        on_delete=models.CASCADE,
        related_name="collection_items",
    )
    article = models.ForeignKey(
        "mobileapi.Article",
        on_delete=models.CASCADE,
        related_name="collection_memberships",
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["collection", "article"],
                name="mobileapi_collection_article_unique",
            )
        ]

    def __str__(self):
        return f"{self.collection} · {self.article}"


class UserReadingEvent(UUIDPrimaryKeyModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reading_events",
    )
    article = models.ForeignKey(
        "mobileapi.Article",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reading_events",
    )
    read_time_ms = models.PositiveIntegerField(default=0)
    event_date = models.DateField(default=_today)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} · {self.event_date} · {self.read_time_ms}ms"


class UserEntitlement(UUIDPrimaryKeyModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="entitlement",
    )
    tier = models.CharField(
        max_length=16,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.FREE,
    )
    qa_override_enabled = models.BooleanField(default=False)
    qa_override_tier = models.CharField(
        max_length=16,
        choices=SubscriptionTier.choices,
        blank=True,
        default="",
    )

    class Meta:
        ordering = ["-updated_at"]

    @property
    def effective_tier(self):
        if self.qa_override_enabled and self.qa_override_tier:
            return self.qa_override_tier
        return self.tier

    def __str__(self):
        return f"{self.user} · {self.effective_tier}"
