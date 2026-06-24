from datetime import timedelta

from django.test import TestCase, override_settings
from django.utils import timezone

from content_pipeline.models import ArticleDraft, DraftStatus, StoryCluster, StoryClusterStatus
from content_pipeline.services.draft_cleanup import expire_stale_drafts


class ExpireStaleDraftsTests(TestCase):
    def setUp(self):
        self.cluster = StoryCluster.objects.create(
            title="Stale story",
            status=StoryClusterStatus.DRAFTED,
        )
        self.old = timezone.now() - timedelta(hours=80)

    def _create_draft(self, **kwargs):
        draft = ArticleDraft.objects.create(
            title=kwargs.pop("title", "Old draft"),
            status=kwargs.pop("status", DraftStatus.IN_REVIEW),
            cluster=kwargs.pop("cluster", self.cluster),
            **kwargs,
        )
        ArticleDraft.objects.filter(id=draft.id).update(created_at=self.old)
        return ArticleDraft.objects.get(id=draft.id)

    @override_settings(PIPELINE_DRAFT_TTL_HOURS=72, PIPELINE_DRAFT_EXPIRE_ENABLED=True)
    def test_deletes_stale_in_review_and_reopens_cluster(self):
        draft = self._create_draft()
        result = expire_stale_drafts()
        self.assertEqual(result["deleted_active"], 1)
        self.assertFalse(ArticleDraft.objects.filter(id=draft.id).exists())
        self.cluster.refresh_from_db()
        self.assertEqual(self.cluster.status, StoryClusterStatus.OPEN)
        self.assertIsNone(self.cluster.drafted_at)

    @override_settings(PIPELINE_DRAFT_TTL_HOURS=72, PIPELINE_DRAFT_EXPIRE_ENABLED=True)
    def test_keeps_approved_and_published(self):
        self._create_draft(status=DraftStatus.APPROVED, title="Keep approved")
        self._create_draft(status=DraftStatus.PUBLISHED, title="Keep published")
        result = expire_stale_drafts()
        self.assertEqual(result["deleted_active"], 0)
        self.assertEqual(ArticleDraft.objects.count(), 2)

    @override_settings(PIPELINE_DRAFT_TTL_HOURS=72, PIPELINE_DRAFT_EXPIRE_ENABLED=True)
    def test_deletes_stale_rejected(self):
        self._create_draft(status=DraftStatus.REJECTED, title="Old rejected", cluster=None)
        result = expire_stale_drafts()
        self.assertEqual(result["deleted_rejected"], 1)
        self.assertEqual(ArticleDraft.objects.count(), 0)

    @override_settings(PIPELINE_DRAFT_TTL_HOURS=72, PIPELINE_DRAFT_EXPIRE_ENABLED=True)
    def test_keeps_fresh_in_review(self):
        ArticleDraft.objects.create(
            title="Fresh",
            status=DraftStatus.IN_REVIEW,
        )
        result = expire_stale_drafts()
        self.assertEqual(result["deleted_active"], 0)
        self.assertEqual(ArticleDraft.objects.count(), 1)
