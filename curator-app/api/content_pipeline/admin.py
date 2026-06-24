from django.contrib import admin, messages
from django.db.models import Case, IntegerField, When
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
        "category",
        "breaking_badge",
        "created_at",
    )
    list_display_links = ("title",)
    list_filter = ("status", "kind", "category", "is_breaking")
    list_per_page = 500
    list_max_show_all = 5000
    show_full_result_count = True
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

    def get_queryset(self, request):
        qs = (
            super()
            .get_queryset(request)
            .select_related("category")
            .annotate(
                review_priority=Case(
                    When(status=DraftStatus.IN_REVIEW, then=0),
                    When(status=DraftStatus.DRAFT, then=1),
                    When(status=DraftStatus.APPROVED, then=2),
                    default=3,
                    output_field=IntegerField(),
                )
            )
            .order_by("review_priority", "-created_at")
        )
        # Default to editorial queue — hide published/rejected unless status filter set.
        if not request.GET.get("status__exact") and not request.GET.get("q"):
            qs = qs.exclude(
                status__in=[DraftStatus.PUBLISHED, DraftStatus.REJECTED]
            )
        return qs

    def changelist_view(self, request, extra_context=None):
        in_review = ArticleDraft.objects.filter(
            status__in=[DraftStatus.DRAFT, DraftStatus.IN_REVIEW]
        ).count()
        approved = ArticleDraft.objects.filter(status=DraftStatus.APPROVED).count()
        showing_queue = not request.GET.get("status__exact") and not request.GET.get("q")
        if showing_queue:
            messages.info(
                request,
                f"Review queue: {in_review} need review, {approved} approved. "
                "Use Status filter → Published to see live drafts.",
            )
        elif in_review:
            messages.info(
                request,
                f"{in_review} draft(s) still need review.",
            )
        return super().changelist_view(request, extra_context=extra_context)

    @admin.display(description="Breaking")
    def breaking_badge(self, obj):
        if obj.is_breaking:
            return format_html('<span style="color:#b91c1c;font-weight:600;">Yes</span>')
        return "—"

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
        import logging

        from content_pipeline.services.post_publish import (
            compute_article_relations_sync,
            generate_article_audio_sync,
            generate_brief_audio_sync,
            resolve_article_image_sync,
            resolve_brief_image_sync,
        )

        logger = logging.getLogger(__name__)
        published = 0
        for draft in queryset:
            try:
                content = publish_draft(draft, reviewed_by=request.user)
            except PublishError as exc:
                self.message_user(request, f"{draft.title}: {exc}", level=messages.WARNING)
                continue
            except Exception as exc:
                logger.exception("Publish failed for draft %s", draft.id)
                self.message_user(
                    request,
                    f"{draft.title}: publish error — {exc}",
                    level=messages.ERROR,
                )
                continue

            try:
                if draft.kind == DraftKind.ARTICLE:
                    resolve_article_image_sync(content)
                    generate_article_audio_sync(str(content.id))
                    compute_article_relations_sync(str(content.id))
                    if draft.is_breaking:
                        from mobileapi.tasks import send_breaking_news_alert

                        try:
                            send_breaking_news_alert.delay(str(content.id))
                        except Exception:
                            send_breaking_news_alert(str(content.id))
                else:
                    resolve_brief_image_sync(content)
                    generate_brief_audio_sync(str(content.id))
            except Exception as exc:
                logger.exception("Post-publish failed for %s", draft.id)
                self.message_user(
                    request,
                    f"Published “{draft.title}” but image/audio step failed: {exc}. "
                    "Run `python manage.py run_pipeline` to backfill.",
                    level=messages.WARNING,
                )
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
