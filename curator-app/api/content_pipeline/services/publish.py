"""Publish approved drafts into live Articles/Briefs (+ kick off narration)."""

import logging

from django.db import transaction
from django.utils import timezone

from content_pipeline.models import ArticleDraft, DraftKind, DraftStatus
from content_pipeline.services.image_resolver import resolve_content_hero_image
from mobileapi.models import Article, ArticleStatus, Brief

logger = logging.getLogger(__name__)


class PublishError(RuntimeError):
    pass


def _draft_source_names(draft):
    return [link.get("name", "") for link in (draft.source_links or []) if link.get("name")]


@transaction.atomic
def publish_draft(draft: ArticleDraft, *, reviewed_by=None, editorial_publish: bool = False):
    """Turn an approved/in-review draft into a live Article or Brief.

    ``editorial_publish=True`` is used by the admin "Publish now" action and
    allows in-review (and draft) rows through without a separate approve step.

    Returns the created content object. Narration is enqueued separately by
    the caller (Celery task) so publishing never blocks on TTS.
    """
    if draft.status == DraftStatus.PUBLISHED:
        raise PublishError("Draft is already published.")
    if draft.status == DraftStatus.REJECTED:
        raise PublishError("Cannot publish a rejected draft.")

    from django.conf import settings

    allowed_statuses = {DraftStatus.APPROVED}
    if editorial_publish:
        allowed_statuses |= {DraftStatus.DRAFT, DraftStatus.IN_REVIEW}
    elif settings.PIPELINE_AUTO_PUBLISH and settings.DEBUG:
        allowed_statuses.add(DraftStatus.IN_REVIEW)
    if draft.status not in allowed_statuses:
        raise PublishError(
            f"Draft must be approved before publishing (current status: {draft.status}). "
            "Use Approve first, or Publish now from the admin action list."
        )

    now = timezone.now()
    published = None

    image_url = (draft.image_url or "").strip()
    image_source_url = ""
    image_attribution = ""
    if not image_url and (draft.image_query or draft.title):
        category_name = draft.category.name if draft.category_id else ""
        resolved = resolve_content_hero_image(
            title=draft.title,
            image_query=draft.image_query,
            category=category_name,
        )
        if resolved:
            image_url = resolved["image_url"]
            image_source_url = resolved.get("image_source_url", "")
            image_attribution = resolved.get("image_attribution", "")

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
            image_url=image_url,
            image_source_url=image_source_url,
            image_attribution=image_attribution,
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
            image_url=image_url or draft.image_url,
            image_attribution=image_attribution,
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
