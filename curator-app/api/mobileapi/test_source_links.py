from datetime import date

from django.test import TestCase

from mobileapi.models import Article, Category
from mobileapi.serializers import ArticleSerializer
from mobileapi.source_links import resolve_source_links


class SourceLinkResolverTests(TestCase):
    def test_maps_legacy_source_codes_to_urls(self):
        links = resolve_source_links(None, ["Reuters", "WHO", "AP"])
        self.assertEqual(len(links), 3)
        self.assertTrue(all(link["url"].startswith("https://") for link in links))

    def test_prefers_explicit_source_links(self):
        explicit = [{"name": "Custom Outlet", "url": "https://example.com/story"}]
        links = resolve_source_links(explicit, ["Reuters"])
        self.assertEqual(links[0]["name"], "Custom Outlet")
        self.assertEqual(links[0]["url"], "https://example.com/story")

    def test_serializer_exposes_resolved_links(self):
        category, _ = Category.objects.get_or_create(
            slug="politics",
            defaults={"name": "Politics", "color": "#000", "icon": "globe", "rank": 1},
        )
        article = Article.objects.create(
            title="Test story",
            excerpt="Excerpt",
            content="Body",
            category=category,
            read_time_minutes=3,
            author="Desk",
            sources=["Reuters", "BBC"],
            source_links=[],
            image_query="test",
            published_at=date(2026, 6, 22),
        )
        data = ArticleSerializer(article).data
        self.assertGreaterEqual(len(data["sourceLinks"]), 2)
        self.assertTrue(data["sourceLinks"][0]["url"].startswith("https://"))
