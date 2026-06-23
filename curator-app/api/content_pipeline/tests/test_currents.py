from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from content_pipeline.services.currents import (
    currents_budget_remaining,
    fetch_currents_entries,
    is_currents_source,
    map_currents_category,
)


class CurrentsSourceTests(SimpleTestCase):
    def test_map_currents_category(self):
        self.assertEqual(map_currents_category("business"), "economy")
        self.assertEqual(map_currents_category("world"), "news")
        self.assertEqual(map_currents_category("unknown"), "news")

    def test_is_currents_source_by_hostname(self):
        source = MagicMock(url="https://api.currentsapi.services/v1/latest-news?country=IN")
        self.assertTrue(is_currents_source(source))

    def test_is_currents_source_by_scheme(self):
        source = MagicMock(url="currents://latest?country=IN")
        self.assertTrue(is_currents_source(source))

    def test_is_not_currents_source(self):
        source = MagicMock(url="https://feeds.bbci.co.uk/news/world/rss.xml")
        self.assertFalse(is_currents_source(source))


@override_settings(CURRENTS_API_KEY="test-key", CURRENTS_DAILY_REQUEST_BUDGET=1000)
class CurrentsFetcherTests(SimpleTestCase):
    @patch("content_pipeline.services.currents.cache")
    @patch("content_pipeline.services.currents.requests.get")
    def test_fetch_currents_entries_parses_news(self, mock_get, mock_cache):
        mock_cache.get.return_value = 0
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "status": "ok",
                "news": [
                    {
                        "id": "abc123",
                        "title": "Test headline",
                        "description": "Summary text",
                        "url": "https://example.com/story",
                        "author": "Reporter",
                        "image": "https://example.com/img.jpg",
                        "published": "2026-06-13T10:00:00Z",
                    }
                ],
            },
        )

        source = MagicMock(
            url="https://api.currentsapi.services/v1/latest-news?country=IN&language=en"
        )
        items = fetch_currents_entries(source)

        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Test headline")
        self.assertEqual(items[0]["external_id"], "abc123")
        self.assertIsInstance(items[0]["published_at"], datetime)
        self.assertEqual(items[0]["published_at"].tzinfo, timezone.utc)

    @override_settings(CURRENTS_API_KEY="")
    def test_fetch_raises_without_api_key(self):
        source = MagicMock(url="https://api.currentsapi.services/v1/latest-news")
        with self.assertRaises(ValueError):
            fetch_currents_entries(source)

    @override_settings(CURRENTS_DAILY_REQUEST_BUDGET=1)
    @patch("content_pipeline.services.currents.cache")
    def test_budget_exhausted_returns_empty(self, mock_cache):
        mock_cache.get.return_value = 1
        source = MagicMock(url="https://api.currentsapi.services/v1/latest-news")
        self.assertEqual(fetch_currents_entries(source), [])
        self.assertEqual(currents_budget_remaining(), 0)
