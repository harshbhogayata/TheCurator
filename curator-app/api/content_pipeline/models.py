from django.conf import settings
from django.db import models
from django.utils import timezone

from common.models import UUIDPrimaryKeyModel


class SourceKind(models.TextChoices):
    RSS = "rss", "RSS / Atom feed"
    API = "api", "News API"


class SourceLicenseStatus(models.TextChoices):
    LICENSED = "licensed", "Licensed / partner feed"
    RSS_PERMITTED = "rss_permitted", "RSS explicitly permitted"
    REVIEW_REQUIRED = "review_required", "Needs legal review"
    BLOCKED = "blocked", "Blocked — do not ingest"


class Source(UUIDPrimaryKeyModel):
    """An upstream news source the pipeline pulls stories from."""

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    kind = models.CharField(max_length=16, choices=SourceKind.choices, default=SourceKind.RSS)
    url = models.URLField(max_length=500)
    homepage_url = models.URLField(max_length=500, blank=True)
    category = models.ForeignKey(
        "mobileapi.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pipeline_sources",
        help_text="Default category hint for stories from this source.",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    license_status = models.CharField(
        max_length=32,
        choices=SourceLicenseStatus.choices,
        default=SourceLicenseStatus.REVIEW_REQUIRED,
        db_index=True,
        help_text="Only licensed or rss_permitted sources are ingested automatically.",
    )
    fetch_interval_minutes = models.PositiveSmallIntegerField(default=60)
    last_fetched_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)
    consecutive_failures = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def is_due(self):
        if not self.last_fetched_at:
            return True
        elapsed = timezone.now() - self.last_fetched_at
        return elapsed.total_seconds() >= self.fetch_interval_minutes * 60


class RawItemStatus(models.TextChoices):
    NEW = "new", "New"
    CLUSTERED = "clustered", "Clustered"
    DISCARDED = "discarded", "Discarded"


class StoryClusterStatus(models.TextChoices):
    OPEN = "open", "Open"
    DRAFTED = "drafted", "Drafted"
    DISCARDED = "discarded", "Discarded"


class StoryCluster(UUIDPrimaryKeyModel):
    """A group of RawItems covering the same underlying story."""

    title = models.CharField(max_length=300)
    category = models.ForeignKey(
        "mobileapi.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="story_clusters",
    )
    status = models.CharField(
        max_length=16,
        choices=StoryClusterStatus.choices,
        default=StoryClusterStatus.OPEN,
        db_index=True,
    )
    is_breaking = models.BooleanField(default=False)
    drafted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class RawItem(UUIDPrimaryKeyModel):
    """A single story fetched from a Source, pre-deduplication."""

    source = models.ForeignKey(Source, on_delete=models.CASCADE, related_name="raw_items")
    external_id = models.CharField(max_length=500, blank=True)
    url = models.URLField(max_length=1000)
    title = models.CharField(max_length=500)
    summary = models.TextField(blank=True)
    author = models.CharField(max_length=240, blank=True)
    image_url = models.URLField(max_length=1000, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    dedup_hash = models.CharField(max_length=64, unique=True)
    status = models.CharField(
        max_length=16,
        choices=RawItemStatus.choices,
        default=RawItemStatus.NEW,
        db_index=True,
    )
    cluster = models.ForeignKey(
        StoryCluster,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="items",
    )
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"], name="rawitem_status_idx"),
        ]

    def __str__(self):
        return f"{self.source.name} · {self.title[:60]}"


class DraftKind(models.TextChoices):
    ARTICLE = "article", "Article"
    BRIEF = "brief", "Brief"


class DraftStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    IN_REVIEW = "in_review", "In review"
    APPROVED = "approved", "Approved"
    PUBLISHED = "published", "Published"
    REJECTED = "rejected", "Rejected"


class ArticleDraft(UUIDPrimaryKeyModel):
    """LLM-generated draft awaiting editorial review before publishing."""

    kind = models.CharField(max_length=16, choices=DraftKind.choices, default=DraftKind.ARTICLE)
    cluster = models.ForeignKey(
        StoryCluster,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="drafts",
    )
    status = models.CharField(
        max_length=16,
        choices=DraftStatus.choices,
        default=DraftStatus.IN_REVIEW,
        db_index=True,
    )
    title = models.CharField(max_length=240)
    excerpt = models.TextField(blank=True)
    content = models.TextField(blank=True)
    category = models.ForeignKey(
        "mobileapi.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="article_drafts",
    )
    author = models.CharField(max_length=140, default="Curator Editorial")
    read_time_minutes = models.PositiveSmallIntegerField(default=5)
    image_query = models.CharField(max_length=255, blank=True)
    image_url = models.URLField(max_length=1000, blank=True)
    topics = models.JSONField(default=list, blank=True)
    # Structured attribution: list of {"name": str, "url": str} dicts.
    source_links = models.JSONField(default=list, blank=True)
    is_breaking = models.BooleanField(default=False)
    llm_model = models.CharField(max_length=64, blank=True)
    review_notes = models.TextField(blank=True)
    scheduled_publish_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_drafts",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    published_article = models.OneToOneField(
        "mobileapi.Article",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pipeline_draft",
    )
    published_brief = models.OneToOneField(
        "mobileapi.Brief",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pipeline_draft",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"], name="draft_status_idx"),
        ]

    def __str__(self):
        return f"[{self.get_status_display()}] {self.title}"
