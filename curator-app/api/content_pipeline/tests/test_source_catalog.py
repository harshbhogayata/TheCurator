from django.test import SimpleTestCase
from django.utils.text import slugify

from content_pipeline.catalog.api_sources import ALL_NEWS_API_SOURCES, estimate_api_requests_per_day
from content_pipeline.catalog.sources import CURRENTS_SOURCES, RSS_SOURCES, estimate_currents_requests_per_day


class SourceCatalogTests(SimpleTestCase):
    def test_rss_slugs_are_unique(self):
        slugs = [slugify(entry["name"]) for entry in RSS_SOURCES]
        self.assertEqual(len(slugs), len(set(slugs)))

    def test_news_api_slugs_are_unique(self):
        slugs = [slugify(entry["name"]) for entry in ALL_NEWS_API_SOURCES]
        self.assertEqual(len(slugs), len(set(slugs)))

    def test_rss_catalog_has_regional_coverage(self):
        rss_regions = {entry.get("region") for entry in RSS_SOURCES}
        for region in ("global", "us", "uk", "india"):
            self.assertIn(region, rss_regions)

    def test_news_api_catalog_has_regional_coverage(self):
        regions = {entry.get("region") for entry in ALL_NEWS_API_SOURCES}
        for region in ("global", "us", "uk", "india"):
            self.assertIn(region, regions)

    def test_currents_budget_estimate_under_free_tier(self):
        self.assertLessEqual(estimate_currents_requests_per_day(), 1000)

    def test_news_api_budget_estimates_are_sane(self):
        estimates = estimate_api_requests_per_day()
        self.assertLessEqual(estimates.get("gnews", 0), 100)
        self.assertLessEqual(estimates.get("worldnews", 0), 50)
        self.assertLessEqual(estimates.get("apitube", 0), 200)
        self.assertLessEqual(estimates.get("currents", 0), 1000)
