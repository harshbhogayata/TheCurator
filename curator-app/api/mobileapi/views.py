from datetime import timedelta

from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, response, status, views

from mobileapi.models import (
    Article,
    Brief,
    UserCollection,
    UserCollectionArticle,
    UserEntitlement,
    UserReadingEvent,
    UserSavedArticle,
)
from mobileapi.serializers import (
    ArticleSerializer,
    BriefSerializer,
    CollectionCreateSerializer,
    CollectionItemWriteSerializer,
    CollectionSerializer,
    CollectionUpdateSerializer,
    EntitlementSerializer,
    EntitlementUpdateSerializer,
    ReadingEventWriteSerializer,
    SavedArticleWriteSerializer,
)


def _parse_int(raw_value, fallback, min_value=0, max_value=100):
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return fallback
    return max(min_value, min(value, max_value))


def _get_or_create_entitlement(user):
    entitlement, _ = UserEntitlement.objects.get_or_create(user=user)
    return entitlement


def _build_reading_stats_payload(user):
    daily_rows = list(
        UserReadingEvent.objects.filter(user=user)
        .values("event_date")
        .annotate(articles_read=Count("id"), read_time_ms=Sum("read_time_ms"))
        .order_by("event_date")
    )

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


class ArticleListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Article.objects.filter(is_active=True)

        query = request.query_params.get("q", "").strip()
        category = request.query_params.get("category", "").strip()
        limit = _parse_int(request.query_params.get("limit"), fallback=100, min_value=1, max_value=200)
        offset = _parse_int(request.query_params.get("offset"), fallback=0, min_value=0, max_value=5000)

        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(excerpt__icontains=query))

        if category:
            queryset = queryset.filter(category__iexact=category)

        payload = ArticleSerializer(queryset[offset : offset + limit], many=True).data
        return response.Response(payload)


class ArticleDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, article_id):
        article = get_object_or_404(Article, id=article_id, is_active=True)
        return response.Response(ArticleSerializer(article).data)


class BriefListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Brief.objects.filter(is_active=True)
        return response.Response(BriefSerializer(queryset, many=True).data)


class SavedArticleCollectionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        article_ids = UserSavedArticle.objects.filter(user=request.user).values_list("article_id", flat=True)
        return response.Response({"articleIds": [str(article_id) for article_id in article_ids]})

    def post(self, request):
        serializer = SavedArticleWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        article = get_object_or_404(Article, id=serializer.validated_data["articleId"], is_active=True)
        UserSavedArticle.objects.get_or_create(user=request.user, article=article)

        article_ids = UserSavedArticle.objects.filter(user=request.user).values_list("article_id", flat=True)
        return response.Response({"articleIds": [str(article_id) for article_id in article_ids]})

    def delete(self, request):
        UserSavedArticle.objects.filter(user=request.user).delete()
        return response.Response({"articleIds": []})


class SavedArticleDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, article_id):
        UserSavedArticle.objects.filter(user=request.user, article_id=article_id).delete()
        article_ids = UserSavedArticle.objects.filter(user=request.user).values_list("article_id", flat=True)
        return response.Response({"articleIds": [str(current_id) for current_id in article_ids]})


class CollectionListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = UserCollection.objects.filter(user=request.user)
        return response.Response({"collections": CollectionSerializer(queryset, many=True).data})

    def post(self, request):
        serializer = CollectionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        collection = UserCollection.objects.create(
            user=request.user,
            name=serializer.validated_data["name"],
            description=serializer.validated_data.get("description", ""),
            color=serializer.validated_data.get("color", "#6366f1"),
            icon=serializer.validated_data.get("icon", "folder"),
        )
        return response.Response(CollectionSerializer(collection).data, status=status.HTTP_201_CREATED)


class CollectionDetailView(views.APIView):
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


class CollectionArticleView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, collection_id):
        collection = get_object_or_404(UserCollection, user=request.user, id=collection_id)

        serializer = CollectionItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        article = get_object_or_404(Article, id=serializer.validated_data["articleId"], is_active=True)
        UserCollectionArticle.objects.get_or_create(collection=collection, article=article)
        return response.Response(CollectionSerializer(collection).data)

    def delete(self, request, collection_id, article_id):
        collection = get_object_or_404(UserCollection, user=request.user, id=collection_id)
        UserCollectionArticle.objects.filter(collection=collection, article_id=article_id).delete()
        return response.Response(CollectionSerializer(collection).data)


class ReadingStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return response.Response(_build_reading_stats_payload(request.user))


class ReadingEventView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ReadingEventWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        article = None
        article_id = serializer.validated_data.get("articleId")
        if article_id:
            article = get_object_or_404(Article, id=article_id, is_active=True)

        UserReadingEvent.objects.create(
            user=request.user,
            article=article,
            read_time_ms=serializer.validated_data["readTimeMs"],
            event_date=timezone.localdate(),
        )

        return response.Response(_build_reading_stats_payload(request.user))


class EntitlementView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entitlement = _get_or_create_entitlement(request.user)
        return response.Response(EntitlementSerializer(entitlement).data)

    def patch(self, request):
        serializer = EntitlementUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        entitlement = _get_or_create_entitlement(request.user)
        entitlement.tier = serializer.validated_data["tier"]
        entitlement.save(update_fields=["tier", "updated_at"])

        return response.Response(EntitlementSerializer(entitlement).data)
