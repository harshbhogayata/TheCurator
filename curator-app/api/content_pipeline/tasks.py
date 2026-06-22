"""Celery tasks orchestrating the ingest -> cluster -> draft -> publish flow."""

import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from content_pipeline.models import (
    ArticleDraft,
    DraftKind,
    DraftStatus,
    RawItemStatus,
    Source,
    SourceLicenseStatus,
    StoryCluster,
    StoryClusterStatus,
)
from content_pipeline.services.dedup import cluster_new_items
from content_pipeline.services.fetchers import fetch_source_safely
from content_pipeline.services.llm import (
    LlmError,
    estimate_read_time_minutes,
    rewrite_cluster_to_article,
    write_daily_brief,
)
from content_pipeline.services.publish import PublishError, publish_draft
from mobileapi.models import Article, ArticleStatus, Category

logger = logging.getLogger(__name__)


@shared_task
def fetch_due_sources():
    """Fetch every active source whose interval has elapsed."""
    if not settings.PIPELINE_ENABLED:
        return 0
    fetched = 0
    for source in Source.objects.filter(
        is_active=True,
        license_status__in=[SourceLicenseStatus.LICENSED, SourceLicenseStatus.RSS_PERMITTED],
    ):
        if source.is_due:
            fetch_source_safely(source)
            fetched += 1
    return fetched


@shared_task
def cluster_raw_items():
    if not settings.PIPELINE_ENABLED:
        return 0
    return cluster_new_items()


def _resolve_category(slug_or_none, fallback=None):
    if slug_or_none:
        category = Category.objects.filter(slug=slug_or_none, is_active=True).first()
        if category:
            return category
    return fallback


@shared_task
def generate_drafts_from_clusters():
    """Rewrite eligible open clusters into editorial drafts."""
    if not settings.PIPELINE_ENABLED:
        return 0

    min_sources = settings.PIPELINE_MIN_CLUSTER_SOURCES
    max_drafts = settings.PIPELINE_MAX_DRAFTS_PER_RUN
    category_slugs = list(
        Category.objects.filter(is_active=True).values_list("slug", flat=True)
    )

    clusters = (
        StoryCluster.objects.filter(status=StoryClusterStatus.OPEN)
        .prefetch_related("items__source")
        .order_by("created_at")
    )

    created = 0
    for cluster in clusters:
        if created >= max_drafts:
            break

        items = [
            item for item in cluster.items.all() if item.status == RawItemStatus.CLUSTERED
        ]
        distinct_sources = {item.source_id for item in items}
        if len(distinct_sources) < min_sources:
            continue

        try:
            payload, model = rewrite_cluster_to_article(
                cluster, items, category_slugs=category_slugs
            )
        except LlmError as exc:
            logger.warning("Pipeline LLM rewrite failed for cluster %s: %s", cluster.id, exc)
            continue

        content = payload["content"].strip()
        source_links = [
            {"name": item.source.name, "url": item.url}
            for item in items
            if item.url
        ]
        image_url = next((item.image_url for item in items if item.image_url), "")

        ArticleDraft.objects.create(
            kind=DraftKind.ARTICLE,
            cluster=cluster,
            status=DraftStatus.IN_REVIEW,
            title=payload["title"].strip()[:240],
            excerpt=payload["excerpt"].strip(),
            content=content,
            category=_resolve_category(payload.get("category"), fallback=cluster.category),
            read_time_minutes=estimate_read_time_minutes(content),
            image_query=str(payload.get("image_query", ""))[:255],
            image_url=image_url,
            topics=payload.get("topics") or [],
            source_links=source_links,
            is_breaking=bool(payload.get("is_breaking")),
            llm_model=model,
        )

        cluster.status = StoryClusterStatus.DRAFTED
        cluster.is_breaking = bool(payload.get("is_breaking"))
        cluster.drafted_at = timezone.now()
        cluster.save(update_fields=["status", "is_breaking", "drafted_at", "updated_at"])
        created += 1

    if created:
        logger.info("Pipeline generated %d draft(s).", created)
    return created


@shared_task
def generate_daily_brief_draft():
    """Draft the daily audio brief from the last 24h of published articles."""
    if not settings.PIPELINE_ENABLED:
        return None

    since = timezone.localdate() - timedelta(days=1)
    articles = list(
        Article.objects.filter(
            is_active=True,
            status=ArticleStatus.PUBLISHED,
            published_at__gte=since,
        ).order_by("-published_at", "rank")[:12]
    )
    if not articles:
        logger.info("Pipeline daily brief skipped: no recent articles.")
        return None

    try:
        payload, model = write_daily_brief(articles)
    except LlmError as exc:
        logger.warning("Pipeline daily brief generation failed: %s", exc)
        return None

    draft = ArticleDraft.objects.create(
        kind=DraftKind.BRIEF,
        status=DraftStatus.IN_REVIEW,
        title=payload["title"].strip()[:240],
        excerpt=payload["summary"].strip()[:500],
        content=payload["summary"].strip(),
        source_links=[
            {"name": article.title, "url": ""} for article in articles
        ],
        llm_model=model,
    )
    logger.info("Pipeline drafted daily brief: %s", draft.title)
    return str(draft.id)


@shared_task
def publish_ready_drafts():
    """Publish approved drafts (scheduled ones once due; the rest immediately).

    With PIPELINE_AUTO_PUBLISH, fresh in-review drafts publish without an
    editor touching them - intended for staging/demo environments only.
    """
    now = timezone.now()
    queryset = ArticleDraft.objects.filter(status=DraftStatus.APPROVED)
    if settings.PIPELINE_AUTO_PUBLISH:
        queryset = ArticleDraft.objects.filter(
            status__in=[DraftStatus.APPROVED, DraftStatus.IN_REVIEW]
        )

    published = 0
    for draft in queryset.order_by("created_at"):
        if draft.scheduled_publish_at and draft.scheduled_publish_at > now:
            continue
        try:
            content = publish_draft(draft)
        except PublishError as exc:
            logger.warning("Pipeline publish failed for draft %s: %s", draft.id, exc)
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

    return published


@shared_task
def compute_article_relations(article_id):
    from content_pipeline.services.related import compute_related_articles

    article = Article.objects.filter(id=article_id).first()
    if article is None:
        return
    try:
        compute_related_articles(article)
    except Exception as exc:  # noqa: BLE001 - related articles are best-effort
        logger.warning("Related-article computation failed for %s: %s", article_id, exc)


@shared_task
def run_pipeline():
    """Hourly orchestration: fetch -> cluster -> draft (-> auto publish)."""
    if not settings.PIPELINE_ENABLED:
        return
    fetch_due_sources()
    cluster_raw_items()
    generate_drafts_from_clusters()
    publish_ready_drafts()


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def generate_article_audio_task(self, article_id):
    from mobileapi.audio_services import (
        AudioGenerationError,
        audio_storage_configured,
        generate_audio_for_article,
    )
    from mobileapi.models import Article as ArticleModel

    if not audio_storage_configured():
        logger.info("Audio generation skipped (storage/TTS not configured).")
        return

    article = ArticleModel.objects.filter(id=article_id).first()
    if article is None or not article.content:
        return
    try:
        generate_audio_for_article(article)
    except AudioGenerationError as exc:
        logger.warning("Article audio generation failed for %s: %s", article_id, exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def generate_brief_audio_task(self, brief_id):
    from mobileapi.audio_services import (
        AudioGenerationError,
        audio_storage_configured,
        generate_audio_for_brief,
    )
    from mobileapi.models import Brief

    if not audio_storage_configured():
        logger.info("Audio generation skipped (storage/TTS not configured).")
        return

    brief = Brief.objects.filter(id=brief_id).first()
    if brief is None or not brief.summary:
        return
    try:
        generate_audio_for_brief(brief)
    except AudioGenerationError as exc:
        logger.warning("Brief audio generation failed for %s: %s", brief_id, exc)
        raise self.retry(exc=exc)
