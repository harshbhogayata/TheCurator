"""One-shot Phase 0 database bootstrap (migrate + seeds). Kokoro not required."""

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

from content_pipeline.services.currents import is_currents_source
from content_pipeline.models import Source


class Command(BaseCommand):
    help = (
        "Phase 0 bootstrap: migrate, seed categories/content, RSS sources, "
        "and Currents API sources when CURRENTS_API_KEY is set."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-migrate",
            action="store_true",
            help="Skip migrate (use when migrations already applied).",
        )
        parser.add_argument(
            "--run-pipeline",
            action="store_true",
            help="Run one pipeline pass after seeding.",
        )

    def handle(self, *args, **options):
        if not options["skip_migrate"]:
            self.stdout.write("Running migrations...")
            call_command("migrate", verbosity=1)

        self.stdout.write("Seeding mobile categories and editorial catalog...")
        call_command("seed_mobile_content", verbosity=1)

        self.stdout.write("Seeding RSS pipeline sources (rss_permitted)...")
        call_command("seed_pipeline_sources", verbosity=1)

        if settings.CURRENTS_API_KEY:
            self.stdout.write("Seeding Currents API sources...")
            call_command("seed_currents_sources", verbosity=1)
        else:
            self.stdout.write(
                self.style.WARNING(
                    "CURRENTS_API_KEY not set — skipped seed_currents_sources. "
                    "Add key on Railway then re-run this command."
                )
            )

        self._print_integration_hints()

        if options["run_pipeline"]:
            self.stdout.write("Running pipeline once...")
            call_command("run_pipeline", verbosity=1)

        self.stdout.write(self.style.SUCCESS("Phase 0 bootstrap finished."))

    def _print_integration_hints(self) -> None:
        pexels = bool(settings.PEXELS_API_KEY)
        unsplash = bool(settings.UNSPLASH_ACCESS_KEY)
        currents = bool(settings.CURRENTS_API_KEY)
        currents_sources = sum(
            1 for source in Source.objects.filter(is_active=True) if is_currents_source(source)
        )

        self.stdout.write("")
        self.stdout.write("Integration readiness:")
        self.stdout.write(f"  Pexels (required):     {'ok' if pexels else 'MISSING PEXELS_API_KEY'}")
        self.stdout.write(
            f"  Unsplash (optional): {'ok' if unsplash else 'not configured (Pexels-only fallback)'}"
        )
        self.stdout.write(
            f"  Currents (optional):   "
            f"{'ok' if currents and currents_sources else 'key missing or no sources seeded'}"
        )
        self.stdout.write("  Kokoro TTS:            deferred (use TTS_PROVIDER=openai for now)")
