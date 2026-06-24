"""Reject editorial drafts that do not meet the multi-outlet coverage bar."""

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from content_pipeline.models import (
    ArticleDraft,
    DraftKind,
    DraftStatus,
    RawItemStatus,
    StoryCluster,
    StoryClusterStatus,
)
from content_pipeline.services.api_common import article_url_domain
from content_pipeline.services.dedup import distinct_coverage_count


def draft_outlet_coverage(draft: ArticleDraft) -> int:
    """Distinct outlets for a draft — cluster items first, else source_links."""
    if draft.cluster_id:
        items = [
            item
            for item in draft.cluster.items.all()
            if item.status == RawItemStatus.CLUSTERED
        ]
        if items:
            return distinct_coverage_count(items)

    links = draft.source_links or []
    domains: set[str] = set()
    names: set[str] = set()
    for link in links:
        domain = article_url_domain(link.get("url", ""))
        if domain:
            domains.add(domain)
        name = (link.get("name") or "").strip().lower()
        if name:
            names.add(name)
    if domains:
        return len(domains)
    if names:
        return len(names)
    return len(links)


class Command(BaseCommand):
    help = (
        "Reject in-review article drafts below the outlet coverage minimum "
        "(reopens their story clusters for future pipeline runs)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--min",
            type=int,
            default=None,
            help="Minimum distinct outlets (default: PIPELINE_MIN_CLUSTER_SOURCES).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be rejected without writing.",
        )

    def handle(self, *args, **options):
        min_sources = options["min"]
        if min_sources is None:
            min_sources = int(settings.PIPELINE_MIN_CLUSTER_SOURCES)

        drafts = (
            ArticleDraft.objects.filter(
                kind=DraftKind.ARTICLE,
                status__in=[DraftStatus.DRAFT, DraftStatus.IN_REVIEW],
            )
            .select_related("cluster")
            .prefetch_related("cluster__items__source")
            .order_by("-created_at")
        )

        to_reject: list[tuple[ArticleDraft, int]] = []
        for draft in drafts:
            coverage = draft_outlet_coverage(draft)
            if coverage < min_sources:
                to_reject.append((draft, coverage))

        if not to_reject:
            self.stdout.write(
                self.style.SUCCESS(
                    f"No in-review drafts below {min_sources} outlet(s)."
                )
            )
            return

        self.stdout.write(
            f"Found {len(to_reject)} draft(s) with < {min_sources} distinct outlet(s):"
        )
        for draft, coverage in to_reject[:15]:
            self.stdout.write(f"  · {coverage} — {draft.title[:72]}")
        if len(to_reject) > 15:
            self.stdout.write(f"  … and {len(to_reject) - 15} more")

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry run — no changes made."))
            return

        now = timezone.now()
        cluster_ids = [draft.cluster_id for draft, _ in to_reject if draft.cluster_id]
        draft_ids = [draft.id for draft, _ in to_reject]

        rejected = ArticleDraft.objects.filter(id__in=draft_ids).update(
            status=DraftStatus.REJECTED,
            reviewed_at=now,
            review_notes="Auto-rejected: below minimum outlet coverage.",
        )
        reopened = 0
        if cluster_ids:
            reopened = (
                StoryCluster.objects.filter(id__in=cluster_ids)
                .filter(~Q(status=StoryClusterStatus.DISCARDED))
                .update(status=StoryClusterStatus.OPEN, drafted_at=None)
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Rejected {rejected} draft(s); reopened {reopened} cluster(s) for cron."
            )
        )
