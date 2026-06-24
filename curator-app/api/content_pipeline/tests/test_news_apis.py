from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from content_pipeline.services.api_registry import fetch_news_api_entries, is_news_api_source
from content_pipeline.services.guardian_api import fetch_guardian_entries, is_guardian_source
from content_pipeline.services.gnews_api import fetch_gnews_entries, is_gnews_source
from content_pipeline.services.apitube_api import fetch_apitube_entries, is_apitube_source
from content_pipeline.services.worldnews_api import fetch_worldnews_entries, is_worldnews_source


class NewsApiDetectionTests(SimpleTestCase):
    def test_registry_detects_providers(self):
        cases = [
            ("https://api.currentsapi.services/v1/latest-news?country=IN", True),
            ("guardian://search?section=world", True),
            ("gnews://top-headlines?category=world", True),
            ("apitube://everything?language.code=en", True),
            ("mediastack://news?countries=us", True),
            ("worldnews://top-news?source-country=us", True),
            ("https://feeds.bbci.co.uk/news/world/rss.xml", False),
        ]
        for url, expected in cases:
            with self.subTest(url=url):
                source = MagicMock(url=url)
                self.assertEqual(is_news_api_source(source), expected)


@override_settings(GUARDIAN_API_KEY="guardian-key", GUARDIAN_API_DAILY_REQUEST_BUDGET=100)
class GuardianFetcherTests(SimpleTestCase):
    @patch("content_pipeline.services.guardian_api.record_request")
    @patch("content_pipeline.services.guardian_api.requests.get")
    def test_fetch_guardian_entries(self, mock_get, _record):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "response": {
                    "status": "ok",
                    "results": [
                        {
                            "id": "world/2026/jun/13/story",
                            "webTitle": "Headline",
                            "webUrl": "https://www.theguardian.com/world/story",
                            "webPublicationDate": "2026-06-13T10:00:00Z",
                            "fields": {
                                "headline": "Headline",
                                "trailText": "Summary",
                                "byline": "Reporter",
                                "thumbnail": "https://example.com/img.jpg",
                            },
                        }
                    ],
                }
            },
        )
        source = MagicMock(url="guardian://search?section=world&page-size=20")
        items = fetch_guardian_entries(source)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Headline")
        self.assertTrue(is_guardian_source(source))


@override_settings(GNEWS_API_KEY="gnews-key", GNEWS_DAILY_REQUEST_BUDGET=100)
class GNewsFetcherTests(SimpleTestCase):
    @patch("content_pipeline.services.gnews_api.record_request")
    @patch("content_pipeline.services.gnews_api.requests.get")
    def test_fetch_gnews_entries(self, mock_get, _record):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "articles": [
                    {
                        "title": "Tech story",
                        "description": "Summary",
                        "url": "https://example.com/story",
                        "image": "https://example.com/img.jpg",
                        "publishedAt": "2026-06-13T10:00:00Z",
                        "source": {"name": "Example News"},
                    }
                ]
            },
        )
        source = MagicMock(url="gnews://top-headlines?category=technology&lang=en&max=10")
        items = fetch_gnews_entries(source)
        self.assertEqual(items[0]["title"], "Tech story")


@override_settings(APITUBE_API_KEY="apitube-key", APITUBE_DAILY_REQUEST_BUDGET=100)
class ApitubeFetcherTests(SimpleTestCase):
    @patch("content_pipeline.services.apitube_api.record_request")
    @patch("content_pipeline.services.apitube_api.requests.get")
    def test_fetch_apitube_entries(self, mock_get, _record):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "status": "ok",
                "results": [
                    {
                        "id": 1,
                        "href": "https://example.com/story",
                        "title": "APITube headline",
                        "description": "Summary",
                        "author": {"name": "Reporter"},
                        "image": "https://example.com/img.jpg",
                        "published_at": "2026-06-13T10:00:00Z",
                    }
                ],
            },
        )
        source = MagicMock(url="apitube://everything?language.code=en&per_page=10")
        items = fetch_apitube_entries(source)
        self.assertEqual(items[0]["title"], "APITube headline")


@override_settings(WORLDNEWS_API_KEY="wn-key", WORLDNEWS_DAILY_REQUEST_BUDGET=50)
class WorldNewsFetcherTests(SimpleTestCase):
    @patch("content_pipeline.services.worldnews_api.record_request")
    @patch("content_pipeline.services.worldnews_api.requests.get")
    def test_fetch_worldnews_top_news(self, mock_get, _record):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "top_news": [
                    {
                        "news": [
                            {
                                "id": 99,
                                "title": "Clustered story",
                                "summary": "Summary",
                                "url": "https://apnews.com/story",
                                "image": "https://example.com/img.jpg",
                                "publish_date": "2026-06-13 10:00:00",
                                "author": "AP",
                            }
                        ]
                    }
                ]
            },
        )
        source = MagicMock(url="worldnews://top-news?source-country=us&language=en")
        items = fetch_worldnews_entries(source)
        self.assertEqual(items[0]["title"], "Clustered story")
        self.assertIsInstance(items[0]["published_at"], datetime)
        self.assertEqual(items[0]["published_at"].tzinfo, timezone.utc)

    def test_registry_dispatch(self):
        source = MagicMock(url="worldnews://top-news?source-country=us&language=en")
        with patch(
            "content_pipeline.services.worldnews_api.fetch_worldnews_entries",
            return_value=[{"title": "x"}],
        ) as mock_fetch:
            items = fetch_news_api_entries(source)
            self.assertEqual(items[0]["title"], "x")
            mock_fetch.assert_called_once_with(source)
        self.assertTrue(is_worldnews_source(source))
