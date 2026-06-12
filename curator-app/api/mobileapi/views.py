from datetime import timedelta
import hashlib
import json
from uuid import UUID

from django.conf import settings
from django.db.models import Count, Q, Sum
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import exceptions, permissions, response, status, views

from common.errors import EntitlementRequired
from common.etag import etag_response
from common.pagination import CursorPage
from onboarding.models import UserPreference

from mobileapi.category_catalog import CONTENT_CATEGORY_CATALOG, resolve_catalog_category_name
from mobileapi.personalization import annotate_search, build_search_filter, personalized_category_slugs
from mobileapi.export_services import export_file_path, validate_download_token, generate_data_export
from mobileapi.revenuecat import process_revenuecat_webhook
from mobileapi.tasks import generate_data_export_task
from mobileapi.models import (
    Article,
    ArticleStatus,
    Brief,
    Category,
    DataExportRequest,
    FeedbackReport,
    IdempotencyKey,
    UserDevice,
    UserCollection,
    UserCollectionArticle,
    UserEntitlement,
    UserReadingEvent,
    UserSavedArticle,
    SubscriptionTier,
)
from mobileapi.serializers import (
    ArticleSerializer,
    ArticleListSerializer,
    BriefSerializer,
    CategorySerializer,
    CollectionCreateSerializer,
    CollectionItemWriteSerializer,
    CollectionSerializer,
    CollectionUpdateSerializer,
    DataExportSerializer,
    DeviceSerializer,
    DeviceWriteSerializer,
    EntitlementSerializer,
    EntitlementQAOverrideSerializer,
    FeedbackCreateSerializer,
    FeedbackSerializer,
    PreferenceSerializer,
    ReadingEventWriteSerializer,
    SavedArticleWriteSerializer,
)


def _parse_int(raw_value, fallback, min_value=0, max_value=100):
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return fallback
    return max(min_value, min(value, max_value))


def _request_fingerprint(request):
    if isinstance(request.data, (dict, list)):
        body_raw = json.dumps(request.data, sort_keys=True, default=str, separators=(",", ":"))
    elif request.data in (None, ""):
        body_raw = ""
    else:
        body_raw = str(request.data)

    payload = f"{request.method}:{request.path}:{body_raw}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _idempotency_preflight(request, required=False):
    key = request.headers.get("Idempotency-Key", "").strip()
    if not key:
        if required:
            return None, response.Response(
                {
                    "detail": "Idempotency-Key header is required for this operation.",
                    "code": "validation_error",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None, None

    fingerprint = _request_fingerprint(request)
    now = timezone.now()
    existing = IdempotencyKey.objects.filter(user=request.user, key=key).first()
    if existing and existing.expires_at <= now:
        existing.delete()
        existing = None

    if existing:
        if existing.request_fingerprint != fingerprint:
            return None, response.Response(
                {
                    "detail": "An idempotent request with this key and a different body already exists.",
                    "code": "idempotency_conflict",
                },
                status=status.HTTP_409_CONFLICT,
            )
        return None, response.Response(existing.response_body, status=existing.response_status)

    return {"key": key, "fingerprint": fingerprint}, None


def _idempotency_store(request, token, payload, status_code=200):
    if not token:
        return

    IdempotencyKey.objects.create(
        user=request.user,
        key=token["key"],
        request_method=request.method,
        request_path=request.path,
        request_fingerprint=token["fingerprint"],
        response_status=status_code,
        response_body=payload if payload is not None else {},
        expires_at=timezone.now() + timedelta(hours=24),
    )


def _get_or_create_entitlement(user):
    entitlement, _ = UserEntitlement.objects.get_or_create(user=user)
    return entitlement


def _tier_limits_for(entitlement):
    effective_tier = entitlement.effective_tier
    limits = {
        SubscriptionTier.FREE: {"max_saves": 25, "max_collections": 3},
        SubscriptionTier.BASIC: {"max_saves": 100, "max_collections": 10},
        SubscriptionTier.PREMIUM: {"max_saves": None, "max_collections": None},
        SubscriptionTier.LIFETIME: {"max_saves": None, "max_collections": None},
    }
    return limits.get(effective_tier, limits[SubscriptionTier.FREE])


def _required_upgrade_tier(current_tier):
    if current_tier == SubscriptionTier.FREE:
        return SubscriptionTier.BASIC
    if current_tier == SubscriptionTier.BASIC:
        return SubscriptionTier.PREMIUM
    return SubscriptionTier.PREMIUM


def _enforce_save_limit(user):
    entitlement = _get_or_create_entitlement(user)
    save_limit = _tier_limits_for(entitlement)["max_saves"]
    if save_limit is None:
        return

    existing_count = UserSavedArticle.objects.filter(user=user).count()
    if existing_count >= save_limit:
        raise EntitlementRequired(_required_upgrade_tier(entitlement.effective_tier))


def _enforce_collection_limit(user):
    entitlement = _get_or_create_entitlement(user)
    collection_limit = _tier_limits_for(entitlement)["max_collections"]
    if collection_limit is None:
        return

    existing_count = UserCollection.objects.filter(user=user).count()
    if existing_count >= collection_limit:
        raise EntitlementRequired(_required_upgrade_tier(entitlement.effective_tier))


def _category_payload_from_articles():
    active_categories = Category.objects.filter(articles__is_active=True).distinct().order_by("rank", "name")
    if active_categories.exists():
        return CategorySerializer(active_categories, many=True).data

    return CONTENT_CATEGORY_CATALOG


def _build_reading_stats_payload(user):
    daily_rows = list(
        UserReadingEvent.objects.filter(user=user)
        .values("event_date")
        .annotate(articles_read=Count("id"), read_time_ms=Sum("read_time_ms"))
        .order_by("-event_date")[:365]
    )
    daily_rows.reverse()

    daily_history = [
        {
            "date": row["event_date"].isoformat(),
            "articlesRead": row["articles_read"],
            "readTimeMs": row["read_time_ms"] or 0,
        }
        for row in daily_rows
    ]

    total_articles_read = sum(row["articles_read"] for row in daily_rows)
    total_read_time_ms = sum((row["read_time_ms"] or 0) for row in daily_rows)
    total_saved = UserSavedArticle.objects.filter(user=user).count()

    active_dates = {row["event_date"] for row in daily_rows if row["articles_read"] > 0}

    if active_dates:
        sorted_dates = sorted(active_dates)
        longest_streak = 1
        streak = 1
        prev = sorted_dates[0]

        for current in sorted_dates[1:]:
            if current == prev + timedelta(days=1):
                streak += 1
            else:
                streak = 1
            longest_streak = max(longest_streak, streak)
            prev = current

        today = timezone.localdate()
        cursor = today if today in active_dates else today - timedelta(days=1)
        current_streak = 0
        while cursor in active_dates:
            current_streak += 1
            cursor -= timedelta(days=1)
    else:
        current_streak = 0
        longest_streak = 0

    recent_article_ids = []
    seen_ids = set()
    recent_rows = UserReadingEvent.objects.filter(user=user, article__isnull=False).order_by("-created_at")
    for article_id in recent_rows.values_list("article_id", flat=True):
        as_string = str(article_id)
        if as_string in seen_ids:
            continue
        seen_ids.add(as_string)
        recent_article_ids.append(as_string)
        if len(recent_article_ids) >= 8:
            break

    return {
        "totalArticlesRead": total_articles_read,
        "totalReadTimeMs": total_read_time_ms,
        "totalSaved": total_saved,
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "dailyHistory": daily_history,
        "recentArticleIds": recent_article_ids,
    }


class ScopedThrottleMixin:
    read_throttle_scope = "reads"
    write_throttle_scope = "writes"
    throttle_scope = "reads"

    def get_throttles(self):
        if self.request.method in permissions.SAFE_METHODS:
            self.throttle_scope = self.read_throttle_scope
        else:
            self.throttle_scope = self.write_throttle_scope
        return super().get_throttles()


class ArticleListView(ScopedThrottleMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    read_throttle_scope = "reads"

    def get_throttles(self):
        if self.request.query_params.get("q", "").strip():
            self.read_throttle_scope = "search"
        else:
            self.read_throttle_scope = "reads"
        return super().get_throttles()

    def get(self, request):
        queryset = Article.objects.filter(is_active=True, status=ArticleStatus.PUBLISHED)

        query = request.query_params.get("q", "").strip()
        category = request.query_params.get("category", "").strip()
        cursor = request.query_params.get("cursor", "").strip()
        ids = request.query_params.get("ids", "").strip()
        saved_only = request.query_params.get("savedOnly", "").strip().lower() in {"1", "true", "yes"}
        limit = _parse_int(request.query_params.get("limit"), fallback=20, min_value=1, max_value=50)

        if query and len(query) < 2:
            return response.Response(
                {
                    "detail": "Search queries must be at least 2 characters long.",
                    "code": "validation_error",
                    "fields": {"q": ["Ensure this field has at least 2 characters."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if query:
            queryset = annotate_search(queryset).filter(build_search_filter(query))

        if category:
            queryset = queryset.filter(Q(category__slug__iexact=category) | Q(category__name__iexact=category))

        feed = request.query_params.get("feed", "").strip().lower().replace("-", "_")
        if feed == "for_you":
            preferred = personalized_category_slugs(request.user)
            if preferred:
                queryset = queryset.filter(category__slug__in=preferred)

        if ids:
            raw_ids = [value.strip() for value in ids.split(",") if value.strip()]
            if len(raw_ids) > 50:
                return response.Response(
                    {
                        "detail": "You can request at most 50 article ids at once.",
                        "code": "validation_error",
                        "fields": {"ids": ["Ensure this list has no more than 50 items."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                article_ids = [UUID(value) for value in raw_ids]
            except ValueError:
                return response.Response(
                    {
                        "detail": "One or more article ids are invalid.",
                        "code": "validation_error",
                        "fields": {"ids": ["Expected comma-separated UUID values."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            queryset = queryset.filter(id__in=article_ids)

        if saved_only:
            queryset = queryset.filter(saved_by__user=request.user).distinct()

        page = CursorPage(queryset=queryset, limit=limit, cursor_str=cursor).apply()
        if page.invalid:
            return response.Response(
                {
                    "detail": "The cursor value is invalid or has expired.",
                    "code": "invalid_cursor",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = page.serialize(ArticleListSerializer)
        return etag_response(request, payload)


class ArticleDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reads"

    def get(self, request, article_id):
        article = get_object_or_404(Article, id=article_id, is_active=True, status=ArticleStatus.PUBLISHED)
        payload = ArticleSerializer(article).data
        return etag_response(request, payload)


class ArticleAudioView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reads"

    def get(self, request, article_id):
        article = get_object_or_404(Article, id=article_id, is_active=True, status=ArticleStatus.PUBLISHED)
        entitlement = _get_or_create_entitlement(request.user)
        if entitlement.effective_tier not in {
            SubscriptionTier.BASIC,
            SubscriptionTier.PREMIUM,
            SubscriptionTier.LIFETIME,
        }:
            raise EntitlementRequired(SubscriptionTier.BASIC)

        if not article.audio_url:
            raise exceptions.NotFound("Audio is not available for this article.")

        return response.Response(
            {
                "audioUrl": article.audio_url,
                "durationSec": article.audio_duration_sec,
            }
        )


class BriefListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reads"

    def get(self, request):
        queryset = Brief.objects.filter(is_active=True)
        cursor = request.query_params.get("cursor", "").strip()
        limit = _parse_int(request.query_params.get("limit"), fallback=20, min_value=1, max_value=50)

        page = CursorPage(queryset=queryset, limit=limit, cursor_str=cursor).apply()
        if page.invalid:
            return response.Response(
                {
                    "detail": "The cursor value is invalid or has expired.",
                    "code": "invalid_cursor",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = page.serialize(BriefSerializer)
        return etag_response(request, payload)


class SavedArticleCollectionView(ScopedThrottleMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_throttles(self):
        if self.request.method == "DELETE":
            self.write_throttle_scope = "sensitive"
        else:
            self.write_throttle_scope = "writes"
        return super().get_throttles()

    def get(self, request):
        article_ids = UserSavedArticle.objects.filter(user=request.user).values_list("article_id", flat=True)
        return response.Response({"articleIds": [str(article_id) for article_id in article_ids]})

    def post(self, request):
        idempotency_token, idempotent_response = _idempotency_preflight(request, required=True)
        if idempotent_response is not None:
            return idempotent_response

        serializer = SavedArticleWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        article = get_object_or_404(Article, id=serializer.validated_data["articleId"], is_active=True, status=ArticleStatus.PUBLISHED)
        existing_save = UserSavedArticle.objects.filter(user=request.user, article=article).exists()
        if existing_save:
            article_ids = UserSavedArticle.objects.filter(user=request.user).values_list("article_id", flat=True)
            payload = {"articleIds": [str(article_id) for article_id in article_ids]}
            _idempotency_store(request, idempotency_token, payload)
            return response.Response(payload)

        _enforce_save_limit(request.user)
        UserSavedArticle.objects.create(user=request.user, article=article)

        article_ids = UserSavedArticle.objects.filter(user=request.user).values_list("article_id", flat=True)
        payload = {"articleIds": [str(article_id) for article_id in article_ids]}
        _idempotency_store(request, idempotency_token, payload)
        return response.Response(payload)

    def delete(self, request):
        if request.query_params.get("clearAll") == "true":
            UserSavedArticle.objects.filter(user=request.user).delete()
            return response.Response({"articleIds": []})
        return response.Response(
            {"detail": "To clear all saved articles, you must pass clearAll=true as a query parameter."},
            status=status.HTTP_400_BAD_REQUEST
        )


class SavedArticleDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "writes"

    def delete(self, request, article_id):
        UserSavedArticle.objects.filter(user=request.user, article_id=article_id).delete()
        article_ids = UserSavedArticle.objects.filter(user=request.user).values_list("article_id", flat=True)
        return response.Response({"articleIds": [str(current_id) for current_id in article_ids]})


class CollectionListView(ScopedThrottleMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = UserCollection.objects.filter(user=request.user)
        serialized = CollectionSerializer(queryset, many=True).data
        return response.Response({"collections": serialized, "items": serialized})

    def post(self, request):
        idempotency_token, idempotent_response = _idempotency_preflight(request, required=True)
        if idempotent_response is not None:
            return idempotent_response

        serializer = CollectionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        _enforce_collection_limit(request.user)

        collection = UserCollection.objects.create(
            user=request.user,
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description", ""),
            color=serializer.validated_data.get("color", "#6366f1"),
            icon=serializer.validated_data.get("icon", "folder"),
        )
        payload = CollectionSerializer(collection).data
        _idempotency_store(request, idempotency_token, payload, status_code=status.HTTP_201_CREATED)
        return response.Response(payload, status=status.HTTP_201_CREATED)


class CollectionDetailView(ScopedThrottleMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, collection_id):
        collection = get_object_or_404(UserCollection, user=request.user, id=collection_id)

        serializer = CollectionUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        for field in ("name", "description", "color", "icon"):
            if field in serializer.validated_data:
                setattr(collection, field, serializer.validated_data[field])

        collection.save()
        return response.Response(CollectionSerializer(collection).data)

    def delete(self, request, collection_id):
        collection = get_object_or_404(UserCollection, user=request.user, id=collection_id)
        collection.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class CollectionArticleView(ScopedThrottleMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, collection_id):
        idempotency_token, idempotent_response = _idempotency_preflight(request, required=True)
        if idempotent_response is not None:
            return idempotent_response

        collection = get_object_or_404(UserCollection, user=request.user, id=collection_id)

        serializer = CollectionItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        article = get_object_or_404(Article, id=serializer.validated_data["articleId"], is_active=True, status=ArticleStatus.PUBLISHED)
        UserCollectionArticle.objects.get_or_create(collection=collection, article=article)
        collection.refresh_from_db()
        payload = CollectionSerializer(collection).data
        _idempotency_store(request, idempotency_token, payload)
        return response.Response(payload)

    def delete(self, request, collection_id, article_id):
        collection = get_object_or_404(UserCollection, user=request.user, id=collection_id)
        UserCollectionArticle.objects.filter(collection=collection, article_id=article_id).delete()
        collection.refresh_from_db()
        return response.Response(CollectionSerializer(collection).data)


class ReadingStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reads"

    def get(self, request):
        return response.Response(_build_reading_stats_payload(request.user))


class ReadingEventView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reading_events"

    def post(self, request):
        idempotency_token, idempotent_response = _idempotency_preflight(request, required=True)
        if idempotent_response is not None:
            return idempotent_response

        serializer = ReadingEventWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        article = None
        article_id = serializer.validated_data.get("articleId")
        if article_id:
            article = get_object_or_404(Article, id=article_id, is_active=True, status=ArticleStatus.PUBLISHED)

        read_time_ms = serializer.validated_data["readTimeMs"]
        raw_read_time = request.data.get("readTimeMs")
        try:
            raw_read_time_int = int(raw_read_time) if raw_read_time is not None else None
        except (TypeError, ValueError):
            raw_read_time_int = None

        if raw_read_time_int is not None and read_time_ms != raw_read_time_int:
            import logging

            logging.getLogger(__name__).warning(
                "Clamped readTimeMs for user %s from %s to %s",
                request.user.id,
                raw_read_time,
                read_time_ms,
            )
        current_hour = timezone.now().replace(minute=0, second=0, microsecond=0)
        existing_event = (
            UserReadingEvent.objects.filter(
                user=request.user,
                article=article,
                created_at__gte=current_hour,
                created_at__lt=current_hour + timedelta(hours=1),
            )
            .order_by("-created_at")
            .first()
        )

        if existing_event is None:
            UserReadingEvent.objects.create(
                user=request.user,
                article=article,
                read_time_ms=read_time_ms,
                event_date=timezone.localdate(),
            )
        else:
            existing_event.read_time_ms = min(existing_event.read_time_ms + read_time_ms, 7_200_000)
            existing_event.event_date = timezone.localdate()
            existing_event.save(update_fields=["read_time_ms", "event_date", "updated_at"])

        payload = _build_reading_stats_payload(request.user)
        _idempotency_store(request, idempotency_token, payload)
        return response.Response(payload)


class CategoryListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reads"

    def get(self, request):
        queryset = Category.objects.filter(is_active=True)
        if queryset.exists():
            items = CategorySerializer(queryset, many=True).data
        else:
            items = _category_payload_from_articles()

        payload = {
            "items": items,
        }
        return etag_response(
            request,
            payload,
            cache_control="public, max-age=3600, stale-while-revalidate=86400",
        )


class PreferenceView(ScopedThrottleMixin, views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        preferences, _ = UserPreference.objects.get_or_create(user=request.user)
        payload = PreferenceSerializer(preferences).data
        return response.Response(payload)

    def patch(self, request):
        preferences, _ = UserPreference.objects.get_or_create(user=request.user)
        serializer = PreferenceSerializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(serializer.data)


class DeviceCollectionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "writes"

    def post(self, request):
        idempotency_token, idempotent_response = _idempotency_preflight(request, required=True)
        if idempotent_response is not None:
            return idempotent_response

        serializer = DeviceWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        device_id = serializer.validated_data.get("deviceId")
        token = serializer.validated_data["expoPushToken"]
        if device_id:
            existing = UserDevice.objects.filter(id=device_id).first()
            if existing and existing.user_id != request.user.id:
                device_id = None

        if device_id:
            UserDevice.objects.filter(user=request.user, expo_push_token=token).exclude(id=device_id).delete()

        UserDevice.objects.filter(expo_push_token=token).exclude(user=request.user).update(
            is_active=False,
        )

        defaults = {
            "expo_push_token": token,
            "platform": serializer.validated_data["platform"],
            "web_push_subscription": serializer.validated_data.get("webPushSubscription") or {},
            "app_version": serializer.validated_data.get("appVersion", ""),
            "last_seen": timezone.now(),
            "is_active": True,
        }

        if device_id:
            device, _ = UserDevice.objects.update_or_create(
                id=device_id,
                user=request.user,
                defaults=defaults,
            )
        else:
            device, _ = UserDevice.objects.update_or_create(
                user=request.user,
                expo_push_token=token,
                defaults=defaults,
            )

        payload = DeviceSerializer(device).data
        _idempotency_store(request, idempotency_token, payload)
        return response.Response(payload)


class DeviceDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "writes"

    def delete(self, request, device_id):
        UserDevice.objects.filter(user=request.user, id=device_id).update(
            is_active=False,
            last_seen=timezone.now(),
        )
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class FeedbackCreateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "feedback"

    def post(self, request):
        idempotency_token, idempotent_response = _idempotency_preflight(request, required=True)
        if idempotent_response is not None:
            return idempotent_response

        serializer = FeedbackCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report = FeedbackReport.objects.create(
            user=request.user,
            category=serializer.validated_data["category"],
            message=serializer.validated_data["message"],
            app_version=serializer.validated_data.get("appVersion", ""),
            os_version=serializer.validated_data.get("osVersion", ""),
            attach_diagnostics=serializer.validated_data.get("attachDiagnostics", False),
        )

        payload = FeedbackSerializer(report).data
        _idempotency_store(request, idempotency_token, payload, status_code=status.HTTP_201_CREATED)
        return response.Response(payload, status=status.HTTP_201_CREATED)


class PrivacyExportRequestView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "sensitive"

    def post(self, request):
        idempotency_token, idempotent_response = _idempotency_preflight(request, required=True)
        if idempotent_response is not None:
            return idempotent_response

        within_day = timezone.now() - timedelta(hours=24)
        export_request = (
            DataExportRequest.objects.filter(user=request.user, created_at__gte=within_day)
            .order_by("-created_at")
            .first()
        )

        if export_request is None:
            export_request = DataExportRequest.objects.create(user=request.user)
            if getattr(settings, "DATA_EXPORT_ASYNC", False):
                generate_data_export_task.delay(export_request.id)
            else:
                try:
                    generate_data_export(export_request.id)
                except Exception as e:
                    import logging
                    logging.getLogger(__name__).exception("Synchronous data export failed: %s", e)

        payload = DataExportSerializer(export_request).data
        _idempotency_store(request, idempotency_token, payload, status_code=status.HTTP_202_ACCEPTED)
        return response.Response(payload, status=status.HTTP_202_ACCEPTED)


class PrivacyExportListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reads"

    def get(self, request):
        queryset = DataExportRequest.objects.filter(user=request.user)
        return response.Response({"items": DataExportSerializer(queryset, many=True).data})


class EntitlementView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "reads"

    def get(self, request):
        entitlement = _get_or_create_entitlement(request.user)
        return response.Response(EntitlementSerializer(entitlement).data)


class EntitlementQAOverrideView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "sensitive"

    def patch(self, request):
        if not request.user.is_staff:
            raise exceptions.PermissionDenied("Staff access required.")

        serializer = EntitlementQAOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        entitlement = _get_or_create_entitlement(request.user)
        entitlement.qa_override_enabled = serializer.validated_data["enabled"]
        entitlement.qa_override_tier = serializer.validated_data.get("tier", "")
        entitlement.save(update_fields=["qa_override_enabled", "qa_override_tier", "updated_at"])

        return response.Response(EntitlementSerializer(entitlement).data)

class PrivacyExportDownloadView(views.APIView):
    permission_classes = []
    authentication_classes = []
    throttle_scope = "reads"

    def get(self, request, export_id):
        token = request.query_params.get("token")
        if not token:
            raise exceptions.PermissionDenied("Download token required.")

        export_request = get_object_or_404(DataExportRequest, id=export_id)
        if not validate_download_token(export_request, token):
            raise exceptions.PermissionDenied("Invalid or expired download token.")

        if export_request.expires_at and export_request.expires_at < timezone.now():
            raise exceptions.PermissionDenied("This download link has expired.")

        if export_request.status != "completed":
            return response.Response({"detail": "Export is not ready."}, status=status.HTTP_400_BAD_REQUEST)

        path = export_file_path(export_request)
        if not path.exists():
            raise exceptions.NotFound("Export file not found.")

        return FileResponse(
            open(path, "rb"),
            as_attachment=True,
            filename=f"curator_export_{export_request.id}.json",
            content_type="application/json",
        )


class RevenueCatWebhookView(views.APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        import hmac
        auth_header = request.headers.get("Authorization", "")
        expected_token = f"Bearer {settings.REVENUECAT_WEBHOOK_SECRET}"

        if not settings.REVENUECAT_WEBHOOK_SECRET or not hmac.compare_digest(auth_header, expected_token):
            raise exceptions.PermissionDenied("Invalid webhook signature.")

        try:
            process_revenuecat_webhook(request.data)
        except ValueError as exc:
            return response.Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return response.Response(status=status.HTTP_200_OK)
