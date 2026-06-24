"""Delete editorial drafts that were never published or approved within the TTL."""

from django.conf import settings
from django.core.management.base import BaseCommand

from content_pipeline.services.draft_cleanup import expire_stale_drafts


class Command(BaseCommand):
    help = (
        "Delete drafts in draft/in-review/rejected older than the TTL. "
        "Approved and published drafts are kept. Reopens clusters for deleted in-review drafts."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours",
            type=int,
            default=None,
            help="TTL in hours (default: PIPELINE_DRAFT_TTL_HOURS, usually 72).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show counts without deleting.",
        )

    def handle(self, *args, **options):
        ttl = options["hours"]
        if ttl is None:
            ttl = int(settings.PIPELINE_DRAFT_TTL_HOURS)

        if not settings.PIPELINE_DRAFT_EXPIRE_ENABLED and not options["dry_run"]:
            self.stdout.write(
                self.style.WARNING(
                    "PIPELINE_DRAFT_EXPIRE_ENABLED=false — set true or pass --dry-run."
                )
            )
            return

        result = expire_stale_drafts(ttl_hours=ttl, dry_run=options["dry_run"])

        prefix = "Would delete" if options["dry_run"] else "Deleted"
        self.stdout.write(
            f"{prefix} {result['deleted_active']} active draft(s) "
            f"and {result['deleted_rejected']} rejected draft(s) "
            f"older than {ttl}h; {result['clusters_reopened']} cluster(s) reopened."
        )
