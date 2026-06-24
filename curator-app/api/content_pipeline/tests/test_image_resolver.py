from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from content_pipeline.services.image_resolver import effective_image_query, resolve_stock_image


class ImageResolverTests(SimpleTestCase):
    def test_effective_image_query_prefers_llm_query(self):
        self.assertEqual(
            effective_image_query(
                title="Long headline here",
                image_query="climate summit",
                category="World News",
            ),
            "climate summit",
        )

    def test_effective_image_query_falls_back_to_category(self):
        self.assertEqual(
            effective_image_query(title="Some headline", image_query="", category="Tech"),
            "Tech news",
        )

    def test_effective_image_query_falls_back_to_title_words(self):
        self.assertEqual(
            effective_image_query(
                title="Markets rally after Fed decision",
                image_query="",
                category="",
            ),
            "Markets rally after Fed decision",
        )

    @override_settings(PEXELS_API_KEY="")
    def test_returns_none_without_api_key(self):
        self.assertIsNone(resolve_stock_image("city skyline"))

    @override_settings(PEXELS_API_KEY="test-key")
    def test_returns_none_for_empty_query(self):
        self.assertIsNone(resolve_stock_image("   "))

    @override_settings(PEXELS_API_KEY="test-key")
    @patch("content_pipeline.services.image_resolver.requests.get")
    def test_resolves_first_pexels_photo(self, mock_get):
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                "photos": [
                    {
                        "photographer": "Jane Doe",
                        "url": "https://www.pexels.com/photo/1/",
                        "src": {"large2x": "https://images.pexels.com/photo.jpg"},
                    }
                ]
            },
        )

        result = resolve_stock_image("climate summit")

        self.assertIsNotNone(result)
        self.assertEqual(result["image_url"], "https://images.pexels.com/photo.jpg")
        self.assertIn("Jane Doe", result["image_attribution"])
        mock_get.assert_called_once()

    @override_settings(PEXELS_API_KEY="test-key", UNSPLASH_ACCESS_KEY="unsplash-key")
    @patch("content_pipeline.services.image_resolver.requests.get")
    def test_falls_back_to_unsplash_when_pexels_empty(self, mock_get):
        unsplash_photo = {
            "user": {"name": "Alex", "links": {"html": "https://unsplash.com/@alex"}},
            "links": {"html": "https://unsplash.com/photos/1"},
            "urls": {"regular": "https://images.unsplash.com/photo.jpg"},
        }

        def side_effect(url, **kwargs):
            if "pexels" in url:
                return MagicMock(status_code=200, json=lambda: {"photos": []})
            return MagicMock(status_code=200, json=lambda: {"results": [unsplash_photo]})

        mock_get.side_effect = side_effect

        result = resolve_stock_image("abstract technology")

        self.assertIsNotNone(result)
        self.assertEqual(result["image_url"], "https://images.unsplash.com/photo.jpg")
        self.assertIn("Alex", result["image_attribution"])
        self.assertEqual(mock_get.call_count, 2)
