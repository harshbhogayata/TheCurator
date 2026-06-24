"""Group RawItems covering the same story into StoryClusters.

Headlines from different outlets rarely share high Jaccard scores, so matching
uses shared keyword overlap (names, places, topics) in addition to Jaccard.
"""

import logging
import re
from collections import Counter
from datetime import timedelta
from urllib.parse import urlparse

from django.db.models import Count
from django.utils import timezone

from content_pipeline.models import (
    RawItem,
    RawItemStatus,
    SourceKind,
    StoryCluster,
    StoryClusterStatus,
)
from content_pipeline.services.api_common import article_url_domain

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.28
CONSOLIDATION_THRESHOLD = 0.24
MIN_SHARED_TOKENS = 3
STALE_SINGLETON_DAYS = 21

STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "into", "over", "after",
    "amid", "what", "when", "where", "will", "have", "has", "are", "was", "were",
    "its", "his", "her", "their", "your", "our", "out", "off", "about", "more",
    "than", "how", "why", "who", "new", "says", "say", "said",
}


def title_tokens(title):
    words = re.findall(r"[a-z0-9]+", (title or "").lower())
    return {word for word in words if len(word) > 2 and word not in STOPWORDS}


def jaccard(a, b):
    if not a or not b:
        return 0.0
    intersection = len(a & b)
    union = len(a | b)
    return intersection / union if union else 0.0


def cluster_similarity(a, b) -> float:
    """Score whether two headlines cover the same story."""
    if not a or not b:
        return 0.0
    shared = len(a & b)
    if shared >= MIN_SHARED_TOKENS:
        return max(jaccard(a, b), SIMILARITY_THRESHOLD)
    return jaccard(a, b)


def distinct_coverage_count(items) -> int:
    """Count distinct outlets covering a cluster.

    RSS/Atom rows count per feed Source. API aggregator rows (e.g. Currents)
    count per article URL domain so multi-outlet API bundles help reach the
    PIPELINE_MIN_CLUSTER_SOURCES bar.
    """
    keys: set[str] = set()
    for item in items:
        if item.source.kind == SourceKind.API:
            netloc = article_url_domain(item.url)
            if netloc:
                keys.add(f"domain:{netloc}")
            continue
        keys.add(f"feed:{item.source_id}")
    return len(keys)


def _open_clusters_queryset():
    return StoryCluster.objects.filter(status=StoryClusterStatus.OPEN)


def consolidate_open_clusters():
    """Merge near-duplicate open clusters so coverage accumulates on one story."""
    open_clusters = list(_open_clusters_queryset().prefetch_related("items"))
    cluster_tokens = {cluster.id: title_tokens(cluster.title) for cluster in open_clusters}
    merged = 0
    survivors: list[StoryCluster] = []

    for cluster in open_clusters:
        if not StoryCluster.objects.filter(id=cluster.id).exists():
            continue

        tokens = cluster_tokens[cluster.id]
        target = None
        target_score = 0.0
        for survivor in survivors:
            if (
                cluster.category_id
                and survivor.category_id
                and cluster.category_id != survivor.category_id
            ):
                continue
            score = cluster_similarity(tokens, cluster_tokens[survivor.id])
            if score >= CONSOLIDATION_THRESHOLD and score > target_score:
                target = survivor
                target_score = score

        if target is None:
            survivors.append(cluster)
            continue

        RawItem.objects.filter(cluster=cluster).update(cluster=target)
        cluster.delete()
        merged += 1

    if merged:
        logger.info("Pipeline consolidated %d overlapping cluster(s).", merged)
    return merged


def merge_singleton_clusters():
    """Attach lone items to an existing multi-outlet cluster when headlines overlap."""
    singles = list(
        _open_clusters_queryset()
        .annotate(item_count=Count("items"))
        .filter(item_count=1)
        .prefetch_related("items__source")
    )
    if not singles:
        return 0

    multipacks = list(
        _open_clusters_queryset()
        .annotate(item_count=Count("items"))
        .filter(item_count__gte=2)
        .prefetch_related("items")
    )
    multipack_tokens = {cluster.id: title_tokens(cluster.title) for cluster in multipacks}
    merged = 0

    for cluster in singles:
        item = cluster.items.first()
        if item is None:
            continue

        tokens = title_tokens(item.title)
        best_target = None
        best_score = 0.0
        for target in multipacks:
            if (
                cluster.category_id
                and target.category_id
                and cluster.category_id != target.category_id
            ):
                continue
            score = cluster_similarity(tokens, multipack_tokens[target.id])
            if score >= CONSOLIDATION_THRESHOLD and score > best_score:
                best_target = target
                best_score = score

        if best_target is None:
            continue

        item.cluster = best_target
        item.save(update_fields=["cluster", "updated_at"])
        cluster.delete()
        merged += 1

    if merged:
        logger.info("Pipeline merged %d singleton cluster(s) into siblings.", merged)
    return merged


def prune_stale_singleton_clusters(max_age_days=STALE_SINGLETON_DAYS):
    """Close ancient one-item clusters that will never reach multi-source coverage."""
    cutoff = timezone.now() - timedelta(days=max_age_days)
    stale_ids = list(
        _open_clusters_queryset()
        .filter(created_at__lt=cutoff)
        .annotate(item_count=Count("items"))
        .filter(item_count__lte=1)
        .values_list("id", flat=True)
    )
    if not stale_ids:
        return 0

    pruned = StoryCluster.objects.filter(id__in=stale_ids).update(
        status=StoryClusterStatus.DISCARDED
    )
    if pruned:
        logger.info("Pipeline pruned %d stale singleton cluster(s).", pruned)
    return pruned


def _dominant_category(cluster):
    counts = Counter(
        item.source.category_id
        for item in cluster.items.select_related("source")
        if item.source.category_id
    )
    if not counts:
        return None
    return counts.most_common(1)[0][0]


def cluster_new_items():
    """Assign every NEW RawItem to a StoryCluster. Returns processed count."""
    open_clusters = list(_open_clusters_queryset())
    cluster_tokens = {cluster.id: title_tokens(cluster.title) for cluster in open_clusters}

    new_items = list(
        RawItem.objects.filter(status=RawItemStatus.NEW)
        .select_related("source")
        .order_by("created_at")
    )
    processed = 0

    for item in new_items:
        tokens = title_tokens(item.title)
        if not tokens:
            item.status = RawItemStatus.DISCARDED
            item.save(update_fields=["status", "updated_at"])
            continue

        best_cluster = None
        best_score = 0.0
        for cluster in open_clusters:
            score = cluster_similarity(tokens, cluster_tokens[cluster.id])
            if score > best_score:
                best_score = score
                best_cluster = cluster

        if best_cluster is not None and best_score >= SIMILARITY_THRESHOLD:
            item.cluster = best_cluster
        else:
            new_cluster = StoryCluster.objects.create(
                title=item.title[:300],
                category=item.source.category,
            )
            open_clusters.append(new_cluster)
            cluster_tokens[new_cluster.id] = tokens
            item.cluster = new_cluster

        item.status = RawItemStatus.CLUSTERED
        item.save(update_fields=["cluster", "status", "updated_at"])
        processed += 1

    consolidate_open_clusters()
    merge_singleton_clusters()
    consolidate_open_clusters()
    prune_stale_singleton_clusters()

    for cluster in _open_clusters_queryset().prefetch_related("items__source"):
        dominant = _dominant_category(cluster)
        if dominant and cluster.category_id != dominant:
            cluster.category_id = dominant
            cluster.save(update_fields=["category", "updated_at"])

    if processed:
        logger.info("Pipeline clustered %d raw item(s).", processed)
    return processed
