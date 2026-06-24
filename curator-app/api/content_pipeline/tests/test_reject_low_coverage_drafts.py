from django.test import TestCase

from content_pipeline.management.commands.reject_low_coverage_drafts import draft_outlet_coverage
from content_pipeline.models import (
    ArticleDraft,
    DraftStatus,
    RawItem,
    Source,
    SourceKind,
    StoryCluster,
)
from mobileapi.models import Category


class RejectLowCoverageDraftsTests(TestCase):
    def setUp(self):
        self.category, _ = Category.objects.get_or_create(
            slug="pipeline-test-news",
            defaults={"name": "Pipeline Test News"},
        )
        self.bbc = Source.objects.create(
            name="BBC World",
            slug="reject-test-bbc",
            kind=SourceKind.RSS,
            url="https://example.com/bbc.xml",
            category=self.category,
        )
        self.cluster = StoryCluster.objects.create(title="Test story")

    def test_draft_coverage_from_source_links(self):
        draft = ArticleDraft.objects.create(
            title="Single source story",
            status=DraftStatus.IN_REVIEW,
            source_links=[{"name": "BBC", "url": "https://bbc.co.uk/news/1"}],
        )
        self.assertEqual(draft_outlet_coverage(draft), 1)

    def test_draft_coverage_from_cluster_items(self):
        RawItem.objects.create(
            source=self.bbc,
            url="https://bbc.co.uk/news/1",
            title="A",
            dedup_hash="reject-a",
            cluster=self.cluster,
        )
        draft = ArticleDraft.objects.create(
            title="Cluster story",
            status=DraftStatus.IN_REVIEW,
            cluster=self.cluster,
            source_links=[
                {"name": "BBC", "url": "https://bbc.co.uk/news/1"},
                {"name": "BBC", "url": "https://bbc.co.uk/news/2"},
            ],
        )
        self.assertEqual(draft_outlet_coverage(draft), 1)
