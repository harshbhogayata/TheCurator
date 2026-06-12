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
from content_pipeline.services.fetchers import fetch_source_safely
from content_pipeline.services.publish import PublishError, publish_draft


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "kind",
        "category",
        "is_active",
        "fetch_interval_minutes",
        "last_fetched_at",
        "consecutive_failures",
    )
    list_filter = ("kind", "is_active", "category")
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
        "kind",
        "status_badge",
        "category",
        "is_breaking",
        "scheduled_publish_at",
        "created_at",
    )
    list_filter = ("status", "kind", "is_breaking", "category")
    search_fields = ("title", "excerpt", "content")
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
    date_hierarchy = "created_at"

    @admin.display(description="Status")
    def status_badge(self, obj):
        colors = {
            DraftStatus.DRAFT: "#64748b",
            DraftStatus.IN_REVIEW: "#b45309",
            DraftStatus.APPROVED: "#15803d",
            DraftStatus.PUBLISHED: "#1d4ed8",
            DraftStatus.REJECTED: "#b91c1c",
        }
        return format_html(
            '<span style="color:{};font-weight:600;">{}</span>',
            colors.get(obj.status, "#64748b"),
            obj.get_status_display(),
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

    @admin.action(description="Publish now (creates live content + narration)")
    def publish_now(self, request, queryset):
        from content_pipeline.tasks import (
            compute_article_relations,
            generate_article_audio_task,
            generate_brief_audio_task,
        )

        published = 0
        for draft in queryset:
            try:
                content = publish_draft(draft, reviewed_by=request.user)
            except PublishError as exc:
                self.message_user(request, f"{draft.title}: {exc}", level=messages.WARNING)
                continue
            if draft.kind == DraftKind.ARTICLE:
                generate_article_audio_task.delay(str(content.id))
                compute_article_relations.delay(str(content.id))
                if draft.is_breaking:
                    from mobileapi.tasks import send_breaking_news_alert

                    send_breaking_news_alert.delay(str(content.id))
            else:
                generate_brief_audio_task.delay(str(content.id))
            published += 1
        if published:
            self.message_user(request, f"Published {published} draft(s).")

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
