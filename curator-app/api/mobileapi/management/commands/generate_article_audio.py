import logging

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q

from mobileapi.audio_services import (
    AudioGenerationError,
    chunk_text,
    default_tts_model,
    default_tts_voice,
    generate_audio_for_article,
)
from mobileapi.models import Article

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Generate narrated audio for articles via OpenAI TTS and upload it to S3/R2 storage."

    def add_arguments(self, parser):
        parser.add_argument("--article-id", help="Generate audio for a single article id.")
        parser.add_argument(
            "--all-missing",
            action="store_true",
            help="Generate audio for every active article that has content but no audio_url.",
        )
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Regenerate audio even when an article already has an audio_url.",
        )
        parser.add_argument("--voice", default=None, help="Override the configured TTS voice.")
        parser.add_argument("--model", default=None, help="Override the configured TTS model.")
        parser.add_argument("--limit", type=int, default=None, help="Process at most N articles.")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be generated without calling TTS or uploading.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        if options["article_id"]:
            queryset = Article.objects.filter(id=options["article_id"])
        elif options["all_missing"]:
            queryset = Article.objects.filter(is_active=True).exclude(content="")
            if not options["overwrite"]:
                queryset = queryset.filter(Q(audio_url="") | Q(audio_url__isnull=True))
        else:
            raise CommandError("Pass --article-id <id> or --all-missing.")

        queryset = queryset.order_by("-published_at", "rank")
        if options["limit"]:
            queryset = queryset[: options["limit"]]

        articles = list(queryset)
        if not articles:
            self.stdout.write(self.style.WARNING("No matching articles to process."))
            return

        processed = 0
        for article in articles:
            chunks = chunk_text(article.content)
            if not chunks:
                self.stdout.write(self.style.WARNING(f"Skipping (no content): {article.title}"))
                continue

            if dry_run:
                total_chars = sum(len(chunk) for chunk in chunks)
                self.stdout.write(
                    f"[dry-run] {article.title}: {len(chunks)} chunk(s), {total_chars} chars"
                )
                continue

            try:
                generate_audio_for_article(
                    article,
                    model=default_tts_model(options["model"]),
                    voice=default_tts_voice(options["voice"]),
                )
            except AudioGenerationError as exc:
                raise CommandError(str(exc)) from exc

            processed += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"Audio set for: {article.title} ({article.audio_duration_sec or '?'}s)"
                )
            )

        self.stdout.write(self.style.SUCCESS(f"Done. Processed {processed} article(s)."))
