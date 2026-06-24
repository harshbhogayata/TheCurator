"""Synchronous post-publish hooks for cron-only deployments (no Celery worker)."""

import logging

from django.conf import settings
from django.db.models import Q

from content_pipeline.models import ArticleDraft, DraftStatus
from content_pipeline.services.image_resolver import resolve_content_hero_image
from mobileapi.audio_services import (
    AudioGenerationError,
    audio_storage_configured,
    generate_audio_for_article,
    generate_audio_for_brief,
)
from mobileapi.models import Article, Brief

logger = logging.getLogger(__name__)


def _apply_resolved_image(obj, resolved):
    obj.image_url = resolved["image_url"]
    if hasattr(obj, "image_source_url"):
        obj.image_source_url = resolved.get("image_source_url", "")
    if hasattr(obj, "image_attribution"):
        obj.image_attribution = resolved.get("image_attribution", "")
    update_fields = ["image_url", "updated_at"]
    if hasattr(obj, "image_source_url"):
        update_fields.append("image_source_url")
    if hasattr(obj, "image_attribution"):
        update_fields.append("image_attribution")
    obj.save(update_fields=update_fields)


def resolve_draft_image_sync(draft: ArticleDraft) -> bool:
    if (draft.image_url or "").strip():
        return False
    category_name = draft.category.name if draft.category_id else ""
    resolved = resolve_content_hero_image(
        title=draft.title,
        image_query=draft.image_query,
        category=category_name,
    )
    if not resolved:
        return False
    draft.image_url = resolved["image_url"]
    draft.save(update_fields=["image_url", "updated_at"])
    logger.info("Resolved draft image: %s", draft.title)
    return True


def resolve_article_image_sync(article: Article) -> bool:
    if (article.image_url or "").strip():
        return False
    category_name = article.category.name if article.category_id else ""
    resolved = resolve_content_hero_image(
        title=article.title,
        image_query=getattr(article, "image_query", ""),
        category=category_name,
    )
    if not resolved:
        return False
    _apply_resolved_image(article, resolved)
    logger.info("Resolved article image: %s", article.title)
    return True


def resolve_brief_image_sync(brief: Brief) -> bool:
    if (brief.image_url or "").strip():
        return False
    resolved = resolve_content_hero_image(title=brief.title, image_query=brief.title)
    if not resolved:
        return False
    brief.image_url = resolved["image_url"]
    if hasattr(brief, "image_attribution"):
        brief.image_attribution = resolved.get("image_attribution", "")
    brief.save(update_fields=["image_url", "image_attribution", "updated_at"])
    logger.info("Resolved brief image: %s", brief.title)
    return True


def resolve_missing_draft_images(*, limit=None) -> int:
    if not getattr(settings, "PIPELINE_RESOLVE_IMAGES_ON_RUN", True):
        return 0
    limit = limit or getattr(settings, "PIPELINE_IMAGE_LIMIT", 25)
    processed = 0
    drafts = (
        ArticleDraft.objects.filter(
            status__in=[DraftStatus.DRAFT, DraftStatus.IN_REVIEW, DraftStatus.APPROVED],
        )
        .filter(Q(image_url="") | Q(image_url__isnull=True))
        .order_by("-updated_at")[:limit]
    )
    for draft in drafts:
        if resolve_draft_image_sync(draft):
            processed += 1
    if processed:
        logger.info("Pipeline resolved %d draft hero image(s).", processed)
    return processed


def resolve_missing_content_images(*, limit=None) -> int:
    """Backfill hero images on live articles/briefs (Pexels → Unsplash)."""
    if not getattr(settings, "PIPELINE_RESOLVE_IMAGES_ON_RUN", True):
        return 0
    limit = limit or getattr(settings, "PIPELINE_IMAGE_LIMIT", 25)
    processed = 0

    articles = (
        Article.objects.filter(is_active=True)
        .filter(Q(image_url="") | Q(image_url__isnull=True))
        .order_by("-published_at", "rank")[:limit]
    )
    for article in articles:
        if resolve_article_image_sync(article):
            processed += 1

    remaining = max(0, limit - processed)
    if remaining:
        briefs = (
            Brief.objects.filter(is_active=True)
            .filter(Q(image_url="") | Q(image_url__isnull=True))
            .order_by("-published_at", "rank")[:remaining]
        )
        for brief in briefs:
            if resolve_brief_image_sync(brief):
                processed += 1

    if processed:
        logger.info("Pipeline resolved %d live hero image(s).", processed)
    return processed


def generate_article_audio_sync(article_id):
    if not audio_storage_configured():
        return False
    article = Article.objects.filter(id=article_id).first()
    if article is None or not (article.content or "").strip():
        return False
    if article.audio_url:
        return False
    try:
        generate_audio_for_article(article)
    except AudioGenerationError as exc:
        logger.warning("Article audio generation failed for %s: %s", article_id, exc)
        return False
    return True


def generate_brief_audio_sync(brief_id):
    if not audio_storage_configured():
        return False
    brief = Brief.objects.filter(id=brief_id).first()
    if brief is None or not (brief.summary or "").strip():
        return False
    if brief.audio_url:
        return False
    try:
        generate_audio_for_brief(brief)
    except AudioGenerationError as exc:
        logger.warning("Brief audio generation failed for %s: %s", brief_id, exc)
        return False
    return True


def compute_article_relations_sync(article_id):
    from content_pipeline.services.related import compute_related_articles

    article = Article.objects.filter(id=article_id).first()
    if article is None:
        return
    try:
        compute_related_articles(article)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Related-article computation failed for %s: %s", article_id, exc)


def generate_missing_content_audio(*, limit=None):
    """Generate narration for articles/briefs missing audio_url (sync, for cron)."""
    if not getattr(settings, "PIPELINE_GENERATE_AUDIO_ON_RUN", True):
        return 0
    if not audio_storage_configured():
        logger.info("Skipping missing audio generation (TTS/storage not configured).")
        return 0

    limit = limit or getattr(settings, "PIPELINE_AUDIO_LIMIT", 25)
    processed = 0

    articles = (
        Article.objects.filter(is_active=True)
        .exclude(content="")
        .filter(Q(audio_url="") | Q(audio_url__isnull=True))
        .order_by("-published_at", "rank")[:limit]
    )
    for article in articles:
        if generate_article_audio_sync(str(article.id)):
            processed += 1
            logger.info("Generated article audio: %s", article.title)

    remaining = max(0, limit - processed)
    if remaining:
        briefs = (
            Brief.objects.filter(is_active=True)
            .exclude(summary="")
            .filter(Q(audio_url="") | Q(audio_url__isnull=True))
            .order_by("-published_at", "rank")[:remaining]
        )
        for brief in briefs:
            if generate_brief_audio_sync(str(brief.id)):
                processed += 1
                logger.info("Generated brief audio: %s", brief.title)

    if processed:
        logger.info("Pipeline generated %d narration file(s).", processed)
    return processed


def run_post_publish_maintenance():
    """Images + audio for cron-only stacks (no Celery worker)."""
    resolve_missing_draft_images()
    resolve_missing_content_images()
    generate_missing_content_audio()
