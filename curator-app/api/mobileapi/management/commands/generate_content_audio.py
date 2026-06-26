import logging

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q

from mobileapi.audio_services import (
    AudioGenerationError,
    audio_storage_configured,
    chunk_text,
    default_tts_model,
    default_tts_voice,
    generate_audio_for_article,
    generate_audio_for_brief,
    resolve_tts_provider,
    storage_backend,
)
from mobileapi.models import Article, Brief

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Generate TTS narration for articles and briefs (Edge TTS by default; OpenAI optional)."

    def add_arguments(self, parser):
        parser.add_argument("--article-id", help="Generate audio for a single article id.")
        parser.add_argument("--brief-id", help="Generate audio for a single brief id.")
        parser.add_argument(
            "--latest-brief",
            action="store_true",
            help="Regenerate the most recently published active brief (no UUID needed).",
        )
        parser.add_argument(
            "--all-missing",
            action="store_true",
            help="Generate audio for every active article/brief missing audio_url.",
        )
        parser.add_argument(
            "--articles-only",
            action="store_true",
            help="With --all-missing, only process articles.",
        )
        parser.add_argument(
            "--briefs-only",
            action="store_true",
            help="With --all-missing, only process briefs.",
        )
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Regenerate audio even when a URL already exists.",
        )
        parser.add_argument("--voice", default=None, help="Override the configured TTS voice.")
        parser.add_argument("--model", default=None, help="Override the configured TTS model.")
        parser.add_argument("--limit", type=int, default=None, help="Process at most N records per type.")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would be generated without calling TTS or uploading.",
        )

    def handle(self, *args, **options):
        if not options["dry_run"] and not audio_storage_configured():
            raise CommandError(
                "Configure TTS (Edge is free by default) and storage "
                "(AUDIO_STORAGE_BACKEND=local with API_PUBLIC_BASE_URL, or AUDIO_S3_*)."
            )

        processed = 0
        if options["article_id"]:
            processed += self._process_articles(
                Article.objects.filter(id=options["article_id"]),
                options,
            )
        elif options["brief_id"]:
            processed += self._process_briefs(
                Brief.objects.filter(id=options["brief_id"]),
                options,
            )
        elif options["latest_brief"]:
            brief = (
                Brief.objects.filter(is_active=True)
                .exclude(summary="")
                .order_by("-published_at", "rank")
                .first()
            )
            if brief is None:
                raise CommandError("No active brief found.")
            self.stdout.write(f"Latest brief: {brief.title} ({brief.id})")
            processed += self._process_briefs(Brief.objects.filter(id=brief.id), options)
        elif options["all_missing"]:
            if not options["briefs_only"]:
                articles = Article.objects.filter(is_active=True).exclude(content="")
                if not options["overwrite"]:
                    articles = articles.filter(Q(audio_url="") | Q(audio_url__isnull=True))
                processed += self._process_articles(articles.order_by("-published_at", "rank"), options)

            if not options["articles_only"]:
                briefs = Brief.objects.filter(is_active=True).exclude(summary="")
                if not options["overwrite"]:
                    briefs = briefs.filter(Q(audio_url="") | Q(audio_url__isnull=True))
                processed += self._process_briefs(briefs.order_by("-published_at", "rank"), options)
        else:
            raise CommandError(
                "Pass --article-id, --brief-id, --latest-brief, or --all-missing."
            )

        if processed == 0 and options["all_missing"]:
            self._print_zero_results_help(options)

        self.stdout.write(self.style.SUCCESS(f"Done. Processed {processed} narration file(s)."))

    def _print_zero_results_help(self, options):
        """Explain why --all-missing found nothing to do."""
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("No narration files were generated. Diagnostics:"))
        self.stdout.write(f"  TTS provider: {resolve_tts_provider()}")
        self.stdout.write(f"  Storage backend: {storage_backend() or 'not configured'}")
        self.stdout.write(f"  audio_generation_configured: {audio_storage_configured()}")

        if not options["briefs_only"]:
            active_articles = Article.objects.filter(is_active=True)
            with_content = active_articles.exclude(content="")
            missing_audio = with_content.filter(Q(audio_url="") | Q(audio_url__isnull=True))
            self.stdout.write(
                f"  Articles: {active_articles.count()} active, "
                f"{with_content.count()} with body text, "
                f"{missing_audio.count()} missing audio_url"
            )
            latest = active_articles.order_by("-created_at").first()
            if latest:
                self.stdout.write(
                    f"  Latest article: {latest.title!r} "
                    f"(content={len(latest.content or '')} chars, "
                    f"audio_url={'set' if latest.audio_url else 'empty'})"
                )

        if not options["articles_only"]:
            active_briefs = Brief.objects.filter(is_active=True)
            with_summary = active_briefs.exclude(summary="")
            missing_audio = with_summary.filter(Q(audio_url="") | Q(audio_url__isnull=True))
            self.stdout.write(
                f"  Briefs: {active_briefs.count()} active, "
                f"{with_summary.count()} with summary, "
                f"{missing_audio.count()} missing audio_url"
            )

        self.stdout.write("")
        self.stdout.write(
            "Common causes: (1) audio already generated on deploy (railway.toml runs this on boot), "
            "(2) published draft has empty body text, (3) TTS not configured in production "
            "(need KOKORO_TTS_URL or OPENAI_API_KEY — Edge is dev-only). "
            "Run: python manage.py verify_audio_storage"
        )
        self.stdout.write("  Or target one item: python manage.py generate_content_audio --article-id <uuid> --dry-run")
        self.stdout.write("")

    def _process_articles(self, queryset, options):
        if options["limit"]:
            queryset = queryset[: options["limit"]]

        processed = 0
        for article in queryset:
            chunks = chunk_text(article.content)
            if not chunks:
                self.stdout.write(self.style.WARNING(f"Skipping article (no content): {article.title}"))
                continue

            if options["dry_run"]:
                total_chars = sum(len(chunk) for chunk in chunks)
                self.stdout.write(
                    f"[dry-run] article · {article.title}: {len(chunks)} chunk(s), {total_chars} chars"
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
                    f"Article audio: {article.title} ({article.audio_duration_sec or '?'}s)"
                )
            )
        return processed

    def _process_briefs(self, queryset, options):
        if options["limit"]:
            queryset = queryset[: options["limit"]]

        processed = 0
        for brief in queryset:
            narration = f"{brief.title}. {brief.summary}".strip()
            chunks = chunk_text(narration)
            if not chunks:
                self.stdout.write(self.style.WARNING(f"Skipping brief (no summary): {brief.title}"))
                continue

            if options["dry_run"]:
                total_chars = sum(len(chunk) for chunk in chunks)
                self.stdout.write(
                    f"[dry-run] brief · {brief.title}: {len(chunks)} chunk(s), {total_chars} chars"
                )
                continue

            try:
                generate_audio_for_brief(
                    brief,
                    model=default_tts_model(options["model"]),
                    voice=default_tts_voice(options["voice"]),
                )
            except AudioGenerationError as exc:
                raise CommandError(str(exc)) from exc

            processed += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f"Brief audio: {brief.title} ({brief.audio_duration_sec or '?'}s)"
                )
            )
        return processed
