"""Group RawItems covering the same story into StoryClusters.

Clustering is intentionally simple: token-set Jaccard similarity over titles
against clusters opened within the last 48 hours. Items that match join the
cluster; otherwise they open a new one.
"""

import logging
import re
from collections import Counter
from datetime import timedelta
from urllib.parse import urlparse

from django.utils import timezone

from content_pipeline.models import (
    RawItem,
    RawItemStatus,
    SourceKind,
    StoryCluster,
    StoryClusterStatus,
)

logger = logging.getLogger(__name__)

CLUSTER_WINDOW_HOURS = 72
SIMILARITY_THRESHOLD = 0.38
CONSOLIDATION_THRESHOLD = 0.32

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


def distinct_coverage_count(items) -> int:
    """Count distinct outlets covering a cluster.

    RSS/Atom rows count per feed Source. API aggregator rows (e.g. Currents)
    count per article URL domain so multi-outlet API bundles help reach the
    PIPELINE_MIN_CLUSTER_SOURCES bar.
    """
    keys: set[str] = set()
    for item in items:
        if item.source.kind == SourceKind.API:
            netloc = urlparse(item.url or "").netloc.lower().removeprefix("www.")
            if netloc:
                keys.add(f"domain:{netloc}")
                continue
        keys.add(f"feed:{item.source_id}")
    return len(keys)


def consolidate_open_clusters():
    """Merge near-duplicate open clusters so coverage accumulates on one story."""
    window_start = timezone.now() - timedelta(hours=CLUSTER_WINDOW_HOURS)
    open_clusters = list(
        StoryCluster.objects.filter(
            status=StoryClusterStatus.OPEN,
            created_at__gte=window_start,
        ).prefetch_related("items")
    )
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
            score = jaccard(tokens, cluster_tokens[survivor.id])
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
    window_start = timezone.now() - timedelta(hours=CLUSTER_WINDOW_HOURS)
    open_clusters = list(
        StoryCluster.objects.filter(
            status=StoryClusterStatus.OPEN,
            created_at__gte=window_start,
        )
    )
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
            score = jaccard(tokens, cluster_tokens[cluster.id])
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

    # Refresh category on clusters that gained items from differently-hinted sources.
    for cluster in open_clusters:
        dominant = _dominant_category(cluster)
        if dominant and cluster.category_id != dominant:
            cluster.category_id = dominant
            cluster.save(update_fields=["category", "updated_at"])

    if processed:
        logger.info("Pipeline clustered %d raw item(s).", processed)
    return processed
