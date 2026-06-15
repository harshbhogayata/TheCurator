from django.conf import settings
from django.db import models
from django.utils import timezone

from common.models import UUIDPrimaryKeyModel


class SubscriptionTier(models.TextChoices):
    FREE = "free", "Free"
    BASIC = "basic", "Basic"
    PREMIUM = "premium", "Premium"
    LIFETIME = "lifetime", "Lifetime"


class Category(UUIDPrimaryKeyModel):
    slug = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=64)
    color = models.CharField(max_length=16, default="#64748b")
    icon = models.CharField(max_length=64, default="layers")
    rank = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["rank", "name"]

    def __str__(self):
        return self.name


class ArticleStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class Article(UUIDPrimaryKeyModel):
    slug = models.SlugField(max_length=280, unique=True, blank=True, default="")
    title = models.CharField(max_length=240)
    excerpt = models.TextField()
    status = models.CharField(
        max_length=16,
        choices=ArticleStatus.choices,
        default=ArticleStatus.PUBLISHED,
        db_index=True,
    )
    category = models.ForeignKey(
        "mobileapi.Category",
        on_delete=models.PROTECT,
        related_name="articles",
    )
    read_time_minutes = models.PositiveSmallIntegerField(default=5)
    published_at = models.DateField(default=timezone.localdate, db_index=True)
    author = models.CharField(max_length=140)
    sources = models.JSONField(default=list, blank=True)
    # Structured attribution: list of {"name": str, "url": str} dicts.
    source_links = models.JSONField(default=list, blank=True)
    topics = models.JSONField(default=list, blank=True)
    image_query = models.CharField(max_length=255, blank=True)
    image_url = models.URLField(blank=True)
    image_source_url = models.URLField(blank=True)
    image_attribution = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)
    audio_url = models.URLField(blank=True)
    audio_duration_sec = models.PositiveIntegerField(null=True, blank=True)
    # Precomputed at publish from embeddings (or topic overlap as fallback).
    related_article_ids = models.JSONField(default=list, blank=True)
    rank = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["-published_at", "rank", "-created_at"]
        indexes = [
            models.Index(fields=["-published_at", "rank", "id"], name="article_feed_idx"),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify

            base_slug = slugify(self.title)[:260] or str(self.id)
            slug = base_slug
            suffix = 2
            while Article.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                suffix_str = f"-{suffix}"
                slug = f"{base_slug[: max(1, 280 - len(suffix_str))]}{suffix_str}"
                suffix += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ArticleEmbedding(UUIDPrimaryKeyModel):
    """Semantic embedding of an article, used for related-article ranking."""

    article = models.OneToOneField(
        "mobileapi.Article",
        on_delete=models.CASCADE,
        related_name="embedding",
    )
    vector = models.JSONField(default=list, blank=True)
    model = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Embedding · {self.article}"


class Brief(UUIDPrimaryKeyModel):
    title = models.CharField(max_length=240)
    summary = models.TextField()
    duration_minutes = models.PositiveSmallIntegerField(default=10)
    published_at = models.DateField(default=timezone.localdate)
    category = models.CharField(max_length=64, default="Daily Brief")
    image_url = models.URLField(blank=True)
    image_attribution = models.CharField(max_length=255, blank=True)
    audio_url = models.URLField(blank=True)
    audio_duration_sec = models.PositiveIntegerField(null=True, blank=True)
    insights = models.PositiveSmallIntegerField(default=0)
    is_breaking = models.BooleanField(default=False)
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
    event_date = models.DateField(default=timezone.localdate, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="reading_event_user_idx"),
        ]

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
    product_id = models.CharField(max_length=128, blank=True)
    revenuecat_customer_id = models.CharField(max_length=128, blank=True)
    stripe_customer_id = models.CharField(max_length=128, blank=True, db_index=True)
    stripe_subscription_id = models.CharField(max_length=128, blank=True)
    razorpay_subscription_id = models.CharField(max_length=128, blank=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=128, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    will_renew = models.BooleanField(default=False)

    class Meta:
        ordering = ["-updated_at"]

    @property
    def effective_tier(self):
        if self.qa_override_enabled and self.qa_override_tier:
            return self.qa_override_tier
        if (
            self.tier != SubscriptionTier.LIFETIME
            and self.expires_at
            and self.expires_at <= timezone.now()
        ):
            return SubscriptionTier.FREE
        return self.tier

    def __str__(self):
        return f"{self.user} · {self.effective_tier}"


class DevicePlatform(models.TextChoices):
    IOS = "ios", "iOS"
    ANDROID = "android", "Android"
    WEB = "web", "Web"


class UserDevice(UUIDPrimaryKeyModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mobile_devices",
    )
    expo_push_token = models.CharField(max_length=255)
    platform = models.CharField(max_length=16, choices=DevicePlatform.choices)
    # Web Push (VAPID) subscription JSON for platform=web devices:
    # {"endpoint": ..., "keys": {"p256dh": ..., "auth": ...}}
    web_push_subscription = models.JSONField(default=dict, blank=True)
    app_version = models.CharField(max_length=32, blank=True)
    last_seen = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-last_seen"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "expo_push_token"],
                name="mobileapi_device_user_token_unique",
            )
        ]

    def __str__(self):
        return f"{self.user} · {self.platform}"


class FeedbackCategory(models.TextChoices):
    BUG = "bug", "Bug"
    IDEA = "idea", "Idea"
    OTHER = "other", "Other"


class FeedbackReport(UUIDPrimaryKeyModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="feedback_reports",
    )
    category = models.CharField(max_length=16, choices=FeedbackCategory.choices)
    message = models.TextField()
    app_version = models.CharField(max_length=32, blank=True)
    os_version = models.CharField(max_length=64, blank=True)
    attach_diagnostics = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} · {self.category}"


class ExportStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class DataExportRequest(UUIDPrimaryKeyModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="data_export_requests",
    )
    status = models.CharField(max_length=16, choices=ExportStatus.choices, default=ExportStatus.PENDING)
    download_url = models.URLField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} · {self.status}"


class RevenueCatWebhookEvent(UUIDPrimaryKeyModel):
    event_id = models.CharField(max_length=128, unique=True)
    event_type = models.CharField(max_length=64)
    app_user_id = models.CharField(max_length=128, blank=True)
    store = models.CharField(max_length=32, blank=True)
    environment = models.CharField(max_length=32, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revenuecat_webhook_events",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event_type} · {self.event_id}"


class IdempotencyKey(UUIDPrimaryKeyModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="idempotency_keys",
    )
    key = models.CharField(max_length=128)
    request_method = models.CharField(max_length=10)
    request_path = models.CharField(max_length=255)
    request_fingerprint = models.CharField(max_length=64)
    response_status = models.PositiveSmallIntegerField()
    response_body = models.JSONField(default=dict, blank=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "key"],
                name="mobileapi_idempotency_user_key_unique",
            )
        ]

    def __str__(self):
        return f"{self.user} · {self.key}"
