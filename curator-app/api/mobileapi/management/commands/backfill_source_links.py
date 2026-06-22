from django.core.management.base import BaseCommand
from django.db import transaction

from mobileapi.models import Article, Brief
from mobileapi.source_links import resolve_source_links


class Command(BaseCommand):
    help = "Backfill source_links on articles and brief metadata from legacy source codes."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report how many rows would change without writing.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        article_updates = 0
        for article in Article.objects.all().iterator():
            links = resolve_source_links(article.source_links, article.sources)
            if links == (article.source_links or []):
                continue
            article_updates += 1
            if not options["dry_run"]:
                article.source_links = links
                article.save(update_fields=["source_links"])

        brief_updates = 0
        for brief in Brief.objects.filter(summary="").iterator():
            continue  # placeholder for future brief source metadata

        if options["dry_run"]:
            self.stdout.write(
                self.style.WARNING(f"[dry-run] Would update source_links on {article_updates} article(s).")
            )
            return

        self.stdout.write(self.style.SUCCESS(f"Updated source_links on {article_updates} article(s)."))
        if brief_updates:
            self.stdout.write(self.style.SUCCESS(f"Updated {brief_updates} brief(s)."))
