from django.test import TestCase, override_settings

from content_pipeline.models import ArticleDraft, DraftKind, DraftStatus, StoryCluster, StoryClusterStatus
from content_pipeline.services.publish import PublishError, publish_draft
from mobileapi.models import Article, Category


class PublishDraftTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            slug="world",
            name="World",
            is_active=True,
        )
        self.cluster = StoryCluster.objects.create(
            title="Cluster",
            category=self.category,
            status=StoryClusterStatus.OPEN,
        )

    def _draft(self, **kwargs):
        defaults = {
            "kind": DraftKind.ARTICLE,
            "cluster": self.cluster,
            "status": DraftStatus.IN_REVIEW,
            "title": "Test narrative",
            "excerpt": "Excerpt",
            "content": "Full body text for the article.",
            "category": self.category,
        }
        defaults.update(kwargs)
        return ArticleDraft.objects.create(**defaults)

    @override_settings(DEBUG=False, PIPELINE_AUTO_PUBLISH=False)
    def test_in_review_requires_approval_for_pipeline_publish(self):
        draft = self._draft()
        with self.assertRaises(PublishError):
            publish_draft(draft)

    @override_settings(DEBUG=False, PIPELINE_AUTO_PUBLISH=False)
    def test_editorial_publish_allows_in_review(self):
        draft = self._draft()
        article = publish_draft(draft, editorial_publish=True)
        draft.refresh_from_db()

        self.assertEqual(draft.status, DraftStatus.PUBLISHED)
        self.assertEqual(article.title, "Test narrative")
        self.assertTrue(Article.objects.filter(id=article.id, is_active=True).exists())

    @override_settings(DEBUG=False, PIPELINE_AUTO_PUBLISH=False)
    def test_editorial_publish_requires_category_for_articles(self):
        draft = self._draft(category=None)
        with self.assertRaises(PublishError):
            publish_draft(draft, editorial_publish=True)
