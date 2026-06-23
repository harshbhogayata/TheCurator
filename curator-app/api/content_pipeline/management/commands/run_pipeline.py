"""Run the full ingest → cluster → draft → publish pipeline once (sync).

Use for Railway cron, manual ops, or when Celery beat is not running.
"""

from django.core.management.base import BaseCommand

from content_pipeline.tasks import run_pipeline


class Command(BaseCommand):
    help = "Run the content pipeline once: fetch sources, cluster, draft, publish ready."

    def handle(self, *args, **options):
        self.stdout.write("Starting pipeline run...")
        run_pipeline()
        self.stdout.write(self.style.SUCCESS("Pipeline run finished."))
