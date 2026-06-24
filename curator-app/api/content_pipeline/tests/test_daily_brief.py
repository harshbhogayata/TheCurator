from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone

from content_pipeline.models import DraftKind, DraftStatus
from content_pipeline.services.daily_brief import (
    estimate_brief_duration_minutes,
    run_daily_brief_pipeline,
    today_brief_exists,
)
from mobileapi.models import Article, ArticleStatus, Brief, Category


class DailyBriefPipelineTests(TestCase):
    def setUp(self):
        self.category, _ = Category.objects.get_or_create(
            slug="news",
            defaults={
                "name": "World News",
                "color": "#000000",
                "icon": "globe",
                "rank": 1,
            },
        )
        today = timezone.localdate()
        for index in range(3):
            Article.objects.create(
                title=f"Story {index}",
                excerpt=f"Excerpt {index}",
                content="Body " * 50,
                category=self.category,
                published_at=today,
                status=ArticleStatus.PUBLISHED,
                is_active=True,
            )

    @override_settings(
        PIPELINE_DAILY_BRIEF_ENABLED=True,
        PIPELINE_DAILY_BRIEF_AUTO_PUBLISH=False,
        PIPELINE_DAILY_BRIEF_MIN_ARTICLES=3,
    )
    @patch("content_pipeline.services.daily_brief.write_daily_brief")
    def test_creates_review_draft_when_auto_publish_disabled(self, mock_write):
        mock_write.return_value = (
            {
                "title": "Your Thursday briefing",
                "summary": "Word " * 950,
                "insights": 3,
            },
            "gpt-4o-mini",
        )

        result = run_daily_brief_pipeline()

        self.assertIsNotNone(result)
        from content_pipeline.models import ArticleDraft

        draft = ArticleDraft.objects.get(id=result)
        self.assertEqual(draft.kind, DraftKind.BRIEF)
        self.assertEqual(draft.status, DraftStatus.IN_REVIEW)
        self.assertFalse(today_brief_exists())

    @override_settings(
        PIPELINE_DAILY_BRIEF_ENABLED=True,
        PIPELINE_DAILY_BRIEF_MIN_ARTICLES=5,
    )
    def test_skips_when_not_enough_articles(self):
        self.assertIsNone(run_daily_brief_pipeline())

    def test_skips_when_today_brief_exists(self):
        Brief.objects.create(
            title="Already live",
            summary="Existing brief",
            published_at=timezone.localdate(),
        )
        self.assertTrue(today_brief_exists())

    def test_estimate_brief_duration_clamps_to_five_to_ten_minutes(self):
        self.assertEqual(estimate_brief_duration_minutes("word " * 400), 5)
        self.assertEqual(estimate_brief_duration_minutes("word " * 950), 7)
        self.assertEqual(estimate_brief_duration_minutes("word " * 2000), 10)
