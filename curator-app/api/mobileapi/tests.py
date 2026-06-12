from datetime import UTC, datetime, timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from mobileapi.models import (
    Article,
    Category,
    SubscriptionTier,
    UserCollection,
    UserEntitlement,
    UserReadingEvent,
    UserSavedArticle,
)
from mobileapi.revenuecat import process_revenuecat_webhook
from users.models import User


class MobileApiContractTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="reader@example.com", password="testpass123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.category, _ = Category.objects.get_or_create(
            slug="economy",
            defaults={"name": "Economy", "color": "#0f766e", "icon": "line-chart"}
        )

        self.article = Article.objects.create(
            title="The Quiet Resurgence of Volatility in Emerging Markets",
            excerpt="A close read of market volatility.",
            category=self.category,
            read_time_minutes=6,
            author="The Curator Editorial Team",
            sources=["FT", "WSJ"],
            image_query="architecture",
            image_url="https://cdn.curator.app/img/example.jpg",
            image_source_url="https://example.com/source",
            image_attribution="Reuters",
            content="Full article body",
            audio_url="https://cdn.curator.app/audio/example.mp3",
            audio_duration_sec=372,
        )
        self.related_article = Article.objects.create(
            title="The Return of Community Banking",
            excerpt="Local finance trends are shifting.",
            category=self.category,
            read_time_minutes=5,
            author="The Curator Economics Desk",
            sources=["FT"],
            content="Related body",
        )

    def test_article_list_is_paginated_and_omits_content(self):
        response = self.client.get("/api/mobile/v1/articles")

        self.assertEqual(response.status_code, 200)
        self.assertIn("items", response.data)
        self.assertIn("nextCursor", response.data)
        matching_item = next(item for item in response.data["items"] if item["id"] == str(self.article.id))
        self.assertEqual(matching_item["slug"], self.article.slug)
        self.assertEqual(matching_item["imageUrl"], self.article.image_url)
        self.assertEqual(matching_item["audioUrl"], "")
        self.assertEqual(matching_item["audioDurationSec"], self.article.audio_duration_sec)
        self.assertNotIn("content", matching_item)

    def test_collection_list_includes_legacy_and_contract_keys(self):
        collection = UserCollection.objects.create(user=self.user, name="Weekend reads")

        response = self.client.get("/api/mobile/v1/collections")

        self.assertEqual(response.status_code, 200)
        self.assertIn("collections", response.data)
        self.assertIn("items", response.data)
        self.assertEqual(response.data["collections"][0]["id"], str(collection.id))
        self.assertEqual(response.data["items"][0]["id"], str(collection.id))
        self.assertIn("updatedAt", response.data["items"][0])

    def test_reading_events_are_clamped_and_merged_within_hour(self):
        first = self.client.post(
            "/api/mobile/v1/reading/events",
            {"articleId": str(self.article.id), "readTimeMs": 100},
            format="json",
            HTTP_IDEMPOTENCY_KEY="first-event",
        )
        second = self.client.post(
            "/api/mobile/v1/reading/events",
            {"articleId": str(self.article.id), "readTimeMs": 7_300_000},
            format="json",
            HTTP_IDEMPOTENCY_KEY="second-event",
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)

        events = UserReadingEvent.objects.filter(user=self.user, article=self.article)
        self.assertEqual(events.count(), 1)
        self.assertEqual(events.first().read_time_ms, 7_200_000)
        self.assertEqual(second.data["totalReadTimeMs"], 7_200_000)

    def test_entitlement_payload_exposes_camel_case_override_fields(self):
        entitlement = UserEntitlement.objects.create(
            user=self.user,
            tier="free",
            qa_override_enabled=True,
            qa_override_tier="premium",
            product_id="curator_premium_monthly",
            will_renew=True,
        )

        response = self.client.get("/api/mobile/v1/entitlements")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["tier"], entitlement.tier)
        self.assertTrue(response.data["qaOverrideEnabled"])
        self.assertEqual(response.data["qaOverrideTier"], "premium")
        self.assertEqual(response.data["productId"], "curator_premium_monthly")
        self.assertTrue(response.data["willRenew"])

    def test_revenuecat_webhook_resolves_database_user_id_and_expiration(self):
        webhook_event, created = process_revenuecat_webhook(
            {
                "event": {
                    "id": "rc_database_user_id",
                    "type": "INITIAL_PURCHASE",
                    "app_user_id": str(self.user.id),
                    "product_id": "curator_premium_monthly",
                    "expiration_at_ms": "1893456000000",
                    "store": "PLAY_STORE",
                    "environment": "PRODUCTION",
                }
            }
        )

        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertTrue(created)
        self.assertEqual(webhook_event.user, self.user)
        self.assertEqual(entitlement.tier, SubscriptionTier.PREMIUM)
        self.assertEqual(entitlement.expires_at, datetime(2030, 1, 1, tzinfo=UTC))
        self.assertTrue(entitlement.will_renew)

    def test_revenuecat_webhook_resolves_firebase_uid_alias(self):
        self.user.firebase_uid = "firebase-reader-123"
        self.user.save(update_fields=["firebase_uid"])

        webhook_event, created = process_revenuecat_webhook(
            {
                "event": {
                    "id": "rc_firebase_alias",
                    "type": "INITIAL_PURCHASE",
                    "app_user_id": "$RCAnonymousID:anonymous-device",
                    "aliases": ["firebase-reader-123"],
                    "product_id": "curator_basic_monthly",
                    "store": "PLAY_STORE",
                    "environment": "PRODUCTION",
                }
            }
        )

        entitlement = UserEntitlement.objects.get(user=self.user)
        self.assertTrue(created)
        self.assertEqual(webhook_event.user, self.user)
        self.assertEqual(webhook_event.app_user_id, "firebase-reader-123")
        self.assertEqual(entitlement.tier, SubscriptionTier.BASIC)

    def test_article_detail_includes_related_article_ids(self):
        response = self.client.get(f"/api/mobile/v1/articles/{self.article.id}")

        self.assertEqual(response.status_code, 200)
        self.assertIn(str(self.related_article.id), response.data["relatedArticleIds"])
        self.assertEqual(response.data["audioUrl"], "")
        self.assertEqual(response.data["audioDurationSec"], self.article.audio_duration_sec)

    def test_namespaced_api_routes_resolve_to_stable_paths(self):
        self.assertEqual(reverse("health:health"), "/health/")
        self.assertEqual(reverse("api:users:auth-session"), "/api/mobile/v1/auth/session")
        self.assertEqual(reverse("api:users:account"), "/api/mobile/v1/account")
        self.assertEqual(reverse("api:onboarding:state"), "/api/mobile/v1/onboarding/")
        self.assertEqual(reverse("api:v1:articles"), "/api/mobile/v1/articles")
        self.assertEqual(reverse("api:v1:reading-stats"), "/api/mobile/v1/reading/stats")
        self.assertEqual(reverse("api:v1:article-audio", kwargs={"article_id": self.article.id}), f"/api/mobile/v1/articles/{self.article.id}/audio")

    def test_category_list_falls_back_to_article_categories_when_table_is_empty(self):
        Article.objects.all().delete()
        Category.objects.all().delete()

        response = self.client.get("/api/mobile/v1/categories")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["items"][0]["slug"], "economy")
        self.assertEqual(response.data["items"][0]["name"], "Economy")

    def test_article_list_accepts_category_slug(self):
        response = self.client.get("/api/mobile/v1/articles", {"category": "economy"})

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data["items"]), 1)
        self.assertTrue(all(item["category"] == "economy" for item in response.data["items"]))

    def test_article_search_requires_at_least_two_characters(self):
        response = self.client.get("/api/mobile/v1/articles", {"q": "a"})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "validation_error")
        self.assertIn("q", response.data["fields"])

    def test_audio_endpoint_requires_paid_tier(self):
        response = self.client.get(f"/api/mobile/v1/articles/{self.article.id}/audio")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "entitlement_required")
        self.assertEqual(response.data["requiredTier"], SubscriptionTier.BASIC)

    def test_audio_endpoint_returns_audio_for_basic_tier(self):
        UserEntitlement.objects.create(user=self.user, tier=SubscriptionTier.BASIC)

        response = self.client.get(f"/api/mobile/v1/articles/{self.article.id}/audio")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["audioUrl"], self.article.audio_url)
        self.assertEqual(response.data["durationSec"], self.article.audio_duration_sec)

    def test_expired_paid_entitlement_does_not_unlock_audio(self):
        UserEntitlement.objects.create(
            user=self.user,
            tier=SubscriptionTier.PREMIUM,
            expires_at=timezone.now() - timedelta(minutes=1),
            will_renew=False,
        )

        response = self.client.get(f"/api/mobile/v1/articles/{self.article.id}/audio")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "entitlement_required")

    def test_save_limit_is_enforced_for_free_users(self):
        for index in range(25):
            article = Article.objects.create(
                title=f"Saved article {index}",
                excerpt="Saved article excerpt",
                category=self.category,
                read_time_minutes=5,
                author="The Curator Editorial Team",
                sources=["AP"],
            )
            UserSavedArticle.objects.create(user=self.user, article=article)

        extra_article = Article.objects.create(
            title="Blocked save",
            excerpt="Blocked save excerpt",
            category=self.category,
            read_time_minutes=5,
            author="The Curator Editorial Team",
            sources=["AP"],
        )

        response = self.client.post(
            "/api/mobile/v1/saves",
            {"articleId": str(extra_article.id)},
            format="json",
            HTTP_IDEMPOTENCY_KEY="save-limit-test",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "entitlement_required")
        self.assertEqual(response.data["requiredTier"], SubscriptionTier.BASIC)

    def test_collection_limit_is_enforced_for_free_users(self):
        for index in range(3):
            UserCollection.objects.create(user=self.user, name=f"Collection {index}")

        response = self.client.post(
            "/api/mobile/v1/collections",
            {"name": "Overflow collection"},
            format="json",
            HTTP_IDEMPOTENCY_KEY="collection-limit-test",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["code"], "entitlement_required")
        self.assertEqual(response.data["requiredTier"], SubscriptionTier.BASIC)
