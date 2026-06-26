from django.contrib import admin, messages
from django.utils import timezone
from django.utils.html import format_html, format_html_join

from content_pipeline.models import (
    ArticleDraft,
    DraftKind,
    DraftStatus,
    RawItem,
    Source,
    StoryCluster,
)
from mobileapi.models import Category
from content_pipeline.services.fetchers import fetch_source_safely
from content_pipeline.services.publish import PublishError, publish_draft


class DraftQueueFilter(admin.SimpleListFilter):
    """Filter drafts by editorial queue without breaking admin changelist queries."""

    title = "queue"
    parameter_name = "queue"

    def lookups(self, request, model_admin):
        return (
            ("review", "Needs review (default)"),
            ("all", "All drafts"),
            ("published", "Published only"),
            ("rejected", "Rejected only"),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == "all":
            return queryset
        if value == "published":
            return queryset.filter(status=DraftStatus.PUBLISHED)
        if value == "rejected":
            return queryset.filter(status=DraftStatus.REJECTED)
        # Default: hide published/rejected noise.
        return queryset.exclude(status__in=[DraftStatus.PUBLISHED, DraftStatus.REJECTED])


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "kind",
        "category",
        "is_active",
        "license_status",
        "fetch_interval_minutes",
        "last_fetched_at",
        "consecutive_failures",
    )
    list_filter = ("kind", "is_active", "license_status", "category")
    search_fields = ("name", "slug", "url")
    prepopulated_fields = {"slug": ("name",)}
    actions = ["fetch_now"]

    @admin.action(description="Fetch selected sources now")
    def fetch_now(self, request, queryset):
        total = 0
        for source in queryset:
            total += fetch_source_safely(source)
        self.message_user(request, f"Fetched {queryset.count()} source(s); {total} new item(s).")


class RawItemInline(admin.TabularInline):
    model = RawItem
    extra = 0
    fields = ("source", "title", "url", "published_at", "status")
    readonly_fields = fields
    can_delete = False


@admin.register(RawItem)
class RawItemAdmin(admin.ModelAdmin):
    list_display = ("title", "source", "status", "published_at", "created_at")
    list_filter = ("status", "source")
    search_fields = ("title", "url")
    readonly_fields = ("dedup_hash", "payload")
    date_hierarchy = "created_at"


@admin.register(StoryCluster)
class StoryClusterAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "is_breaking", "item_count", "created_at")
    list_filter = ("status", "is_breaking", "category")
    search_fields = ("title",)
    inlines = [RawItemInline]

    @admin.display(description="Items")
    def item_count(self, obj):
        return obj.items.count()


@admin.register(ArticleDraft)
class ArticleDraftAdmin(admin.ModelAdmin):
    """The editorial review queue: approve, schedule, publish, or reject drafts."""

    list_display = (
        "title",
        "status_badge",
        "category_label",
        "breaking_badge",
        "created_at",
    )
    list_display_links = ("title",)
    list_filter = (DraftQueueFilter, "status", "category")
    list_per_page = 200
    list_max_show_all = 2000
    show_full_result_count = False
    search_fields = ("title", "excerpt")
    ordering = ("-created_at",)
    readonly_fields = (
        "cluster",
        "llm_model",
        "reviewed_by",
        "reviewed_at",
        "published_article",
        "published_brief",
        "source_links",
        "content_preview",
    )
    fieldsets = (
        ("Review", {"fields": ("status", "review_notes", "scheduled_publish_at")}),
        (
            "Content",
            {
                "fields": (
                    "kind",
                    "title",
                    "excerpt",
                    "content",
                    "content_preview",
                    "category",
                    "author",
                    "read_time_minutes",
                    "topics",
                    "is_breaking",
                )
            },
        ),
        ("Imagery", {"fields": ("image_query", "image_url")}),
        (
            "Provenance",
            {
                "fields": (
                    "cluster",
                    "source_links",
                    "llm_model",
                    "reviewed_by",
                    "reviewed_at",
                    "published_article",
                    "published_brief",
                )
            },
        ),
    )
    actions = ["approve_drafts", "publish_now", "reject_drafts", "send_back_to_review"]

    def changelist_view(self, request, extra_context=None):
        import logging

        logger = logging.getLogger(__name__)
        try:
            return super().changelist_view(request, extra_context=extra_context)
        except Exception:
            logger.exception("ArticleDraft changelist_view failed")
            raise

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("category")

    @admin.display(description="Category", ordering="category__name")
    def category_label(self, obj):
        if not obj.category_id:
            return "-"
        try:
            return obj.category.name
        except Category.DoesNotExist:
            return "(missing)"

    @admin.display(description="Breaking")
    def breaking_badge(self, obj):
        if obj.is_breaking:
            return format_html(
                '<span style="color:#b91c1c;font-weight:600;">{}</span>',
                "Yes",
            )
        return "-"

    @admin.display(description="Status")
    def status_badge(self, obj):
        colors = {
            DraftStatus.DRAFT: "#64748b",
            DraftStatus.IN_REVIEW: "#b45309",
            DraftStatus.APPROVED: "#15803d",
            DraftStatus.PUBLISHED: "#1d4ed8",
            DraftStatus.REJECTED: "#b91c1c",
        }
        label = obj.get_status_display()
        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            colors.get(obj.status, "#64748b"),
            label,
        )

    @admin.display(description="Preview")
    def content_preview(self, obj):
        paragraphs = [p for p in (obj.content or "").split("\n\n") if p.strip()][:4]
        if not paragraphs:
            return "(empty)"
        body = format_html_join("", "<p>{}</p>", ((p,) for p in paragraphs))
        return format_html('<div style="max-width:640px;line-height:1.6;">{}</div>', body)

    @admin.action(description="Approve (publishes on next scheduler run)")
    def approve_drafts(self, request, queryset):
        count = queryset.filter(
            status__in=[DraftStatus.DRAFT, DraftStatus.IN_REVIEW]
        ).update(
            status=DraftStatus.APPROVED,
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )
        self.message_user(request, f"Approved {count} draft(s).")

    @admin.action(description="Publish now (creates live content; audio via pipeline)")
    def publish_now(self, request, queryset):
        import logging

        from content_pipeline.services.post_publish import (
            resolve_article_image_sync,
            resolve_brief_image_sync,
        )

        logger = logging.getLogger(__name__)
        published = 0
        skipped = 0
        for draft in queryset:
            try:
                content = publish_draft(
                    draft,
                    reviewed_by=request.user,
                    editorial_publish=True,
                )
            except PublishError as exc:
                skipped += 1
                self.message_user(
                    request,
                    f"“{draft.title}”: {exc}",
                    level=messages.WARNING,
                )
                continue
            except Exception as exc:
                skipped += 1
                logger.exception("Publish failed for draft %s", draft.id)
                self.message_user(
                    request,
                    f"“{draft.title}”: publish error — {exc}",
                    level=messages.ERROR,
                )
                continue

            try:
                if draft.kind == DraftKind.ARTICLE:
                    resolve_article_image_sync(content)
                    if draft.is_breaking:
                        from mobileapi.tasks import send_breaking_news_alert

                        try:
                            send_breaking_news_alert.delay(str(content.id))
                        except Exception:
                            send_breaking_news_alert(str(content.id))
                else:
                    resolve_brief_image_sync(content)
            except Exception as exc:
                logger.exception("Post-publish image failed for %s", draft.id)
                self.message_user(
                    request,
                    f"Published “{draft.title}” but image step failed: {exc}",
                    level=messages.WARNING,
                )
            published += 1
            self.message_user(
                request,
                f"Published “{draft.title}”.",
                level=messages.SUCCESS,
            )

        if published == 0 and skipped == 0:
            self.message_user(request, "No drafts selected.", level=messages.WARNING)
        elif published == 0:
            self.message_user(
                request,
                f"No drafts published ({skipped} skipped). See messages above.",
                level=messages.ERROR,
            )
        elif published:
            self.message_user(
                request,
                f"Published {published} draft(s). Audio fills in on run_pipeline or "
                "generate_content_audio.",
            )

    @admin.action(description="Reject")
    def reject_drafts(self, request, queryset):
        count = queryset.exclude(status=DraftStatus.PUBLISHED).update(
            status=DraftStatus.REJECTED,
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )
        self.message_user(request, f"Rejected {count} draft(s).")

    @admin.action(description="Send back to review")
    def send_back_to_review(self, request, queryset):
        count = queryset.exclude(status=DraftStatus.PUBLISHED).update(
            status=DraftStatus.IN_REVIEW
        )
        self.message_user(request, f"Moved {count} draft(s) back to review.")
