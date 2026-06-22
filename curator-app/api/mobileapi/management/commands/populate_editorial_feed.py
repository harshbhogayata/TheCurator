from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed 25 articles + today/yesterday briefs, backfill source links, optionally generate audio."

    def add_arguments(self, parser):
        parser.add_argument(
            "--generate-audio",
            action="store_true",
            help="Generate TTS narration for all content missing audio (requires TTS + storage env).",
        )
        parser.add_argument(
            "--skip-seed",
            action="store_true",
            help="Only backfill links / audio without re-upserting editorial copy.",
        )

    def handle(self, *args, **options):
        if not options["skip_seed"]:
            call_command("seed_mobile_content")
        call_command("backfill_source_links")
        if options["generate_audio"]:
            call_command("generate_content_audio", "--all-missing")
        self.stdout.write(self.style.SUCCESS("Editorial feed population complete."))
