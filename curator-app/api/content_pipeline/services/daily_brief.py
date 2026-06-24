"""Daily audio brief: synthesize the last day's published articles into one narration."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from content_pipeline.models import ArticleDraft, DraftKind, DraftStatus
from content_pipeline.services.llm import LlmError, write_daily_brief
from content_pipeline.services.post_publish import (
    generate_brief_audio_sync,
    resolve_brief_image_sync,
)
from content_pipeline.services.publish import PublishError, publish_draft
from mobileapi.models import Article, ArticleStatus, Brief

logger = logging.getLogger(__name__)


def estimate_brief_duration_minutes(script: str) -> int:
    """Rough spoken duration at ~140 wpm; clamp to a 5–10 minute editorial target."""
    words = len((script or "").split())
    minutes = round(words / 140)
    return max(5, min(10, minutes)) if words else 5


def articles_for_daily_brief():
    """Published articles from today and yesterday (local calendar)."""
    since = timezone.localdate() - timedelta(days=1)
    return list(
        Article.objects.filter(
            is_active=True,
            status=ArticleStatus.PUBLISHED,
            published_at__gte=since,
        )
        .select_related("category")
        .order_by("-published_at", "rank")[:20]
    )


def today_brief_exists() -> bool:
    today = timezone.localdate()
    return Brief.objects.filter(is_active=True, published_at=today).exists()


def run_daily_brief_pipeline() -> str | None:
    """Create (and optionally publish) one brief per local calendar day.

    Returns the live Brief id when published, the draft id when left in review,
    or None when skipped.
    """
    if not getattr(settings, "PIPELINE_DAILY_BRIEF_ENABLED", True):
        return None

    if today_brief_exists():
        logger.info("Daily brief skipped: brief already published for %s.", timezone.localdate())
        return None

    min_articles = int(getattr(settings, "PIPELINE_DAILY_BRIEF_MIN_ARTICLES", 3))
    articles = articles_for_daily_brief()
    if len(articles) < min_articles:
        logger.info(
            "Daily brief skipped: only %d article(s) in window (need %d).",
            len(articles),
            min_articles,
        )
        return None

    try:
        payload, model = write_daily_brief(articles)
    except LlmError as exc:
        logger.warning("Daily brief LLM failed: %s", exc)
        return None

    summary = payload["summary"].strip()
    auto_publish = getattr(settings, "PIPELINE_DAILY_BRIEF_AUTO_PUBLISH", True)
    status = DraftStatus.APPROVED if auto_publish else DraftStatus.IN_REVIEW

    draft = ArticleDraft.objects.create(
        kind=DraftKind.BRIEF,
        status=status,
        title=payload["title"].strip()[:240],
        excerpt=summary[:500],
        content=summary,
        source_links=[
            {"name": article.title, "url": ""}
            for article in articles
        ],
        llm_model=model,
    )
    logger.info("Daily brief draft created: %s (%s)", draft.title, status)

    if not auto_publish:
        return str(draft.id)

    try:
        brief = publish_draft(draft)
    except PublishError as exc:
        logger.warning("Daily brief publish failed: %s", exc)
        return str(draft.id)

    # Refresh duration estimate from script length (audio duration filled after TTS).
    brief.duration_minutes = estimate_brief_duration_minutes(summary)
    brief.insights = int(payload.get("insights") or len(articles))
    brief.save(update_fields=["duration_minutes", "insights", "updated_at"])

    try:
        resolve_brief_image_sync(brief)
        generate_brief_audio_sync(str(brief.id))
    except Exception as exc:
        logger.exception("Daily brief post-publish failed for %s: %s", brief.id, exc)

    logger.info("Daily brief published: %s", brief.title)
    return str(brief.id)
