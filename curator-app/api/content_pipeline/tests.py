from django.test import TestCase

from content_pipeline.models import SourceLicenseStatus
from content_pipeline.services.dedup import jaccard, title_tokens
from content_pipeline.services.fetchers import compute_dedup_hash, normalize_url


class DedupUtilityTests(TestCase):
    def test_normalize_url_strips_query_and_fragment(self):
        normalized = normalize_url("https://Example.com/path/?utm=1#section")
        self.assertEqual(normalized, "https://example.com/path")

    def test_compute_dedup_hash_is_stable(self):
        first = compute_dedup_hash("https://example.com/a", "Title")
        second = compute_dedup_hash("https://example.com/a?utm=1", "Title")
        self.assertEqual(first, second)

    def test_jaccard_similar_titles(self):
        a = title_tokens("India cuts rates amid inflation worries")
        b = title_tokens("India cuts interest rates as inflation eases")
        self.assertGreater(jaccard(a, b), 0.3)

    def test_ingestible_license_statuses(self):
        allowed = {SourceLicenseStatus.LICENSED, SourceLicenseStatus.RSS_PERMITTED}
        self.assertNotIn(SourceLicenseStatus.REVIEW_REQUIRED, allowed)
        self.assertNotIn(SourceLicenseStatus.BLOCKED, allowed)
