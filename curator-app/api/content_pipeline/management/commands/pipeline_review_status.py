"""Print editorial queue stats (daily admin review habit / cron logging)."""

from django.core.management.base import BaseCommand

from content_pipeline.models import ArticleDraft, DraftStatus


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
        else:
            self.stdout.write(self.style.SUCCESS("Editorial queue clear."))
