import uuid

from django.test import TestCase

from content_pipeline.models import RawItem, Source, SourceKind, StoryCluster
from content_pipeline.services.dedup import cluster_similarity, distinct_coverage_count, title_tokens
from mobileapi.models import Category


class DistinctCoverageCountTests(TestCase):
    def setUp(self):
        self.category, _ = Category.objects.get_or_create(
            slug="pipeline-test-news",
            defaults={"name": "Pipeline Test News"},
        )
        self.bbc = Source.objects.create(
            name="BBC World",
            slug="bbc-world",
            kind=SourceKind.RSS,
            url="https://example.com/bbc.xml",
            category=self.category,
        )
        self.npr = Source.objects.create(
            name="NPR News",
            slug="npr-news",
            kind=SourceKind.RSS,
            url="https://example.com/npr.xml",
            category=self.category,
        )
        self.currents = Source.objects.create(
            name="Currents World",
            slug="currents-world",
            kind=SourceKind.API,
            url="https://api.currentsapi.services/v1/latest-news",
            category=self.category,
        )
        self.cluster = StoryCluster.objects.create(title="Major policy shift announced")

    def _item(self, source, url, title="Story"):
        return RawItem.objects.create(
            source=source,
            url=url,
            title=title,
            dedup_hash=uuid.uuid4().hex,
            cluster=self.cluster,
        )

    def test_rss_feeds_count_per_source(self):
        items = [
            self._item(self.bbc, "https://bbc.co.uk/news/1"),
            self._item(self.npr, "https://npr.org/news/1"),
        ]
        self.assertEqual(distinct_coverage_count(items), 2)

    def test_api_aggregator_counts_per_article_domain(self):
        items = [
            self._item(self.currents, "https://www.bbc.co.uk/news/world-1"),
            self._item(self.currents, "https://www.npr.org/sections/news/1"),
            self._item(self.currents, "https://apnews.com/article/1"),
            self._item(self.bbc, "https://bbc.co.uk/news/2"),
            self._item(self.npr, "https://npr.org/news/2"),
        ]
        self.assertEqual(distinct_coverage_count(items), 5)

    def test_title_tokens_strip_stopwords(self):
        tokens = title_tokens("The President says new policy after summit")
        self.assertNotIn("the", tokens)
        self.assertIn("president", tokens)
        self.assertIn("policy", tokens)

    def test_cluster_similarity_boosts_shared_names(self):
        a = title_tokens(
            "Tension builds between Trump and Senate Republicans, putting GOP agenda on the line"
        )
        b = title_tokens("Trump pressures Senate Republicans to pass GOP agenda bill")
        self.assertGreaterEqual(cluster_similarity(a, b), 0.28)
