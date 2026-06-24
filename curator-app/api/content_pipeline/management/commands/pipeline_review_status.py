"""Print editorial queue stats (daily admin review habit / cron logging)."""

from collections import Counter

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from content_pipeline.models import (
    ArticleDraft,
    DraftStatus,
    RawItemStatus,
    StoryCluster,
    StoryClusterStatus,
)
from content_pipeline.services.dedup import distinct_coverage_count


class Command(BaseCommand):
    help = "Show how many pipeline drafts need review, approval, or publish."

    def handle(self, *args, **options):
        in_review = ArticleDraft.objects.filter(
            status__in=[DraftStatus.DRAFT, DraftStatus.IN_REVIEW]
        ).count()
        approved = ArticleDraft.objects.filter(status=DraftStatus.APPROVED).count()
        published_today = ArticleDraft.objects.filter(status=DraftStatus.PUBLISHED).count()

        self.stdout.write(f"Drafts needing review:  {in_review}")
        self.stdout.write(f"Approved (publish queue): {approved}")
        self.stdout.write(f"Published (total):        {published_today}")

        min_sources = settings.PIPELINE_MIN_CLUSTER_SOURCES
        open_clusters = (
            StoryCluster.objects.filter(status=StoryClusterStatus.OPEN)
            .prefetch_related("items__source")
            .order_by("-created_at")
        )
        coverage_counts: list[int] = []
        eligible = 0
        for cluster in open_clusters:
            items = [
                item for item in cluster.items.all() if item.status == RawItemStatus.CLUSTERED
            ]
            coverage = distinct_coverage_count(items)
            coverage_counts.append(coverage)
            if coverage >= min_sources:
                eligible += 1

        self.stdout.write("")
        self.stdout.write(f"Open story clusters:      {len(coverage_counts)}")
        self.stdout.write(
            f"Eligible for drafting:    {eligible} "
            f"(need {min_sources}+ distinct outlets)"
        )
        if coverage_counts:
            histogram = Counter(coverage_counts)
            buckets = ", ".join(f"{count}→{n}" for count, n in sorted(histogram.items()))
            self.stdout.write(f"Coverage distribution:    {buckets}")
            top = sorted(
                (
                    (
                        distinct_coverage_count(
                            [
                                item
                                for item in cluster.items.all()
                                if item.status == RawItemStatus.CLUSTERED
                            ]
                        ),
                        cluster.title[:80],
                    )
                    for cluster in open_clusters[:5]
                ),
                reverse=True,
            )
            self.stdout.write("Top open clusters:")
            for coverage, title in top:
                self.stdout.write(f"  · {coverage} outlets — {title}")

        if in_review:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    f"Action: open /admin/content_pipeline/articledraft/ "
                    f"and review {in_review} draft(s)."
                )
            )
        elif approved:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    f"Action: {approved} approved draft(s) will publish on next run_pipeline "
                    "(or use Publish now in admin)."
                )
            )
        elif eligible:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    f"Action: {eligible} cluster(s) ready — run_pipeline should draft on "
                    "the next cron tick (or run manually now)."
                )
            )
        elif open_clusters.exists():
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    f"No clusters meet the {min_sources}-outlet bar yet. "
                    "Stories need more overlapping coverage or a lower "
                    "PIPELINE_MIN_CLUSTER_SOURCES."
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS("Editorial queue clear."))

        from mobileapi.models import Brief

        today = timezone.localdate()
        if Brief.objects.filter(is_active=True, published_at=today).exists():
            self.stdout.write(self.style.SUCCESS(f"Daily brief for {today}: published."))
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"No daily brief for {today} yet — runs after publish_ready_drafts "
                    "when PIPELINE_DAILY_BRIEF_ENABLED=true."
                )
            )
