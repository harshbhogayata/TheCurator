"""Expire editorial drafts that were never published or approved."""

from __future__ import annotations

import logging
from datetime import timedelta

from django.conf import settings
from django.db.models import Q
from django.utils import timezone

from content_pipeline.models import ArticleDraft, DraftStatus, StoryCluster, StoryClusterStatus

logger = logging.getLogger(__name__)

ACTIVE_STATUSES = (DraftStatus.DRAFT, DraftStatus.IN_REVIEW)


def expire_stale_drafts(*, ttl_hours: int | None = None, dry_run: bool = False) -> dict[str, int]:
    """
    Remove drafts that are not published or approved and older than ``ttl_hours``.

    - Deletes in-review / draft rows and reopens their story clusters.
    - Deletes rejected rows past the same TTL (keeps the admin queue tidy).
    - Never touches approved or published drafts.
    """
    if not getattr(settings, "PIPELINE_DRAFT_EXPIRE_ENABLED", True):
        return {"deleted_active": 0, "deleted_rejected": 0, "clusters_reopened": 0}

    ttl_hours = int(ttl_hours if ttl_hours is not None else settings.PIPELINE_DRAFT_TTL_HOURS)
    cutoff = timezone.now() - timedelta(hours=ttl_hours)

    stale_active = ArticleDraft.objects.filter(
        status__in=ACTIVE_STATUSES,
        created_at__lt=cutoff,
    )
    stale_rejected = ArticleDraft.objects.filter(
        status=DraftStatus.REJECTED,
        created_at__lt=cutoff,
    )

    if dry_run:
        cluster_count = stale_active.filter(cluster_id__isnull=False).values("cluster_id").distinct().count()
        return {
            "deleted_active": stale_active.count(),
            "deleted_rejected": stale_rejected.count(),
            "clusters_reopened": cluster_count,
        }

    cluster_ids = list(
        stale_active.filter(cluster_id__isnull=False).values_list("cluster_id", flat=True).distinct()
    )
    reopened = 0
    if cluster_ids:
        reopened = (
            StoryCluster.objects.filter(id__in=cluster_ids)
            .filter(~Q(status=StoryClusterStatus.DISCARDED))
            .update(status=StoryClusterStatus.OPEN, drafted_at=None)
        )

    deleted_active, _ = stale_active.delete()
    deleted_rejected, _ = stale_rejected.delete()

    if deleted_active or deleted_rejected:
        logger.info(
            "Expired stale drafts (ttl=%sh): deleted_active=%s deleted_rejected=%s clusters_reopened=%s",
            ttl_hours,
            deleted_active,
            deleted_rejected,
            reopened,
        )

    return {
        "deleted_active": deleted_active,
        "deleted_rejected": deleted_rejected,
        "clusters_reopened": reopened,
    }
