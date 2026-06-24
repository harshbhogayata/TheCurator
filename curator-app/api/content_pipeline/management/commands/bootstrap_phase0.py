"""One-shot Phase 0 database bootstrap (migrate + seeds). Kokoro not required."""

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

from content_pipeline.services.api_registry import is_news_api_source
from content_pipeline.models import Source


class Command(BaseCommand):
    help = (
        "Phase 0 bootstrap: migrate, seed categories/content, RSS sources, "
        "and licensed news API sources (Currents, Guardian, GNews, etc.)."
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

        self.stdout.write("Seeding licensed news API source catalog...")
        call_command("seed_currents_sources", verbosity=1)

        self._print_integration_hints()

        if options["run_pipeline"]:
            self.stdout.write("Running pipeline once...")
            call_command("run_pipeline", verbosity=1)

        self.stdout.write(self.style.SUCCESS("Phase 0 bootstrap finished."))

    def _print_integration_hints(self) -> None:
        pexels = bool(settings.PEXELS_API_KEY)
        unsplash = bool(settings.UNSPLASH_ACCESS_KEY)
        api_keys = {
            "currents": bool(settings.CURRENTS_API_KEY),
            "guardian": bool(settings.GUARDIAN_API_KEY),
            "gnews": bool(settings.GNEWS_API_KEY),
            "apitube": bool(settings.APITUBE_API_KEY),
            "mediastack": bool(settings.MEDIASTACK_API_KEY),
            "worldnews": bool(settings.WORLDNEWS_API_KEY),
        }
        api_sources = sum(
            1 for source in Source.objects.filter(is_active=True) if is_news_api_source(source)
        )

        self.stdout.write("")
        self.stdout.write("Integration readiness:")
        self.stdout.write(f"  Pexels (required):     {'ok' if pexels else 'MISSING PEXELS_API_KEY'}")
        self.stdout.write(
            f"  Unsplash (optional): {'ok' if unsplash else 'not configured (Pexels-only fallback)'}"
        )
        configured = [name for name, ok in api_keys.items() if ok]
        self.stdout.write(
            f"  News APIs:             "
            f"{', '.join(configured) if configured else 'no API keys set'} "
            f"({api_sources} sources in catalog)"
        )
        self.stdout.write("  Kokoro TTS:            deferred (use TTS_PROVIDER=openai for now)")
