"""Publish approved drafts into live Articles/Briefs (+ kick off narration)."""

import logging

from django.db import transaction
from django.utils import timezone

from content_pipeline.models import ArticleDraft, DraftKind, DraftStatus
from mobileapi.models import Article, ArticleStatus, Brief

logger = logging.getLogger(__name__)


class PublishError(RuntimeError):
    pass


def _draft_source_names(draft):
    return [link.get("name", "") for link in (draft.source_links or []) if link.get("name")]


@transaction.atomic
def publish_draft(draft: ArticleDraft, *, reviewed_by=None):
    """Turn an approved/in-review draft into a live Article or Brief.

    Returns the created content object. Narration is enqueued separately by
    the caller (Celery task) so publishing never blocks on TTS.
    """
    if draft.status == DraftStatus.PUBLISHED:
        raise PublishError("Draft is already published.")
    if draft.status == DraftStatus.REJECTED:
        raise PublishError("Cannot publish a rejected draft.")

    now = timezone.now()
    published = None

    if draft.kind == DraftKind.ARTICLE:
        if draft.category is None:
            raise PublishError("Draft has no category; assign one before publishing.")
        published = Article.objects.create(
            title=draft.title,
            excerpt=draft.excerpt,
            content=draft.content,
            category=draft.category,
            author=draft.author,
            read_time_minutes=draft.read_time_minutes,
            published_at=timezone.localdate(),
            sources=_draft_source_names(draft),
            source_links=draft.source_links or [],
            topics=draft.topics or [],
            image_query=draft.image_query,
            image_url=draft.image_url,
            status=ArticleStatus.PUBLISHED,
            is_active=True,
        )
        draft.published_article = published
    else:
        published = Brief.objects.create(
            title=draft.title,
            summary=draft.content or draft.excerpt,
            duration_minutes=max(1, round(len((draft.content or "").split()) / 150)),
            published_at=timezone.localdate(),
            image_url=draft.image_url,
            insights=max(1, len(draft.source_links or [])),
            is_breaking=draft.is_breaking,
            is_active=True,
        )
        draft.published_brief = published

    draft.status = DraftStatus.PUBLISHED
    draft.reviewed_by = reviewed_by or draft.reviewed_by
    draft.reviewed_at = now
    draft.save(
        update_fields=[
            "status",
            "reviewed_by",
            "reviewed_at",
            "published_article",
            "published_brief",
            "updated_at",
        ]
    )

    logger.info("Pipeline published %s draft: %s", draft.kind, draft.title)
    return published
