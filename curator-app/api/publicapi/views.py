"""Unauthenticated read-only endpoints powering the public website (SSR/SEO).

These endpoints serve only published, active content, cache rendered payloads
in Redis, and emit CDN-friendly Cache-Control headers so an edge cache (e.g.
Cloudflare) can absorb most traffic.
"""

from django.core.cache import cache
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import response, serializers, status, throttling, views

from common.etag import etag_response
from common.pagination import CursorPage
from mobileapi.models import Article, ArticleStatus, Brief, Category
from mobileapi.personalization import annotate_search, build_search_filter
from mobileapi.serializers import (
    ArticleListSerializer,
    ArticleSerializer,
    BriefSerializer,
    CategorySerializer,
)
from publicapi.launch_notify import normalize_launch_notify_email, register_launch_notify_email

PUBLIC_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
PUBLIC_DETAIL_CACHE_CONTROL = "public, max-age=120, s-maxage=600, stale-while-revalidate=3600"
CACHE_TTL_SECONDS = 60


class PublicReadThrottle(throttling.AnonRateThrottle):
    scope = "public_reads"


class LaunchNotifyThrottle(throttling.AnonRateThrottle):
    scope = "launch_notify"


class LaunchNotifySerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    source = serializers.CharField(max_length=64, required=False, allow_blank=True, default="launch_site")


class LaunchNotifyView(views.APIView):
    """Unauthenticated waitlist signup from the launch / coming-soon site."""

    authentication_classes = []
    permission_classes = []
    throttle_classes = [LaunchNotifyThrottle]

    def post(self, request):
        serializer = LaunchNotifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = normalize_launch_notify_email(serializer.validated_data["email"])
        source = (serializer.validated_data.get("source") or "launch_site").strip()[:64]

        signup, created = register_launch_notify_email(email=email, source=source)
        payload = {
            "status": "registered" if created else "already_registered",
            "email": signup.email,
        }
        return response.Response(payload, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class PublicApiView(views.APIView):
    """Base: no auth handshake, anonymous throttling, public visibility only."""

    authentication_classes = []
    permission_classes = []
    throttle_classes = [PublicReadThrottle]


def published_articles():
    return Article.objects.filter(is_active=True, status=ArticleStatus.PUBLISHED)


def _parse_limit(raw, fallback=20):
    try:
        return max(1, min(int(raw), 50))
    except (TypeError, ValueError):
        return fallback


class PublicArticleListView(PublicApiView):
    def get(self, request):
        category = request.query_params.get("category", "").strip()
        cursor = request.query_params.get("cursor", "").strip()
        query = request.query_params.get("q", "").strip()
        limit = _parse_limit(request.query_params.get("limit"))

        cache_key = f"publicapi:articles:{category}:{cursor}:{query}:{limit}"
        payload = cache.get(cache_key)

        if payload is None:
            queryset = published_articles()
            if query:
                if len(query) < 2:
                    return response.Response(
                        {
                            "detail": "Search queries must be at least 2 characters long.",
                            "code": "validation_error",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                queryset = annotate_search(queryset).filter(build_search_filter(query))
            if category:
                queryset = queryset.filter(
                    Q(category__slug__iexact=category) | Q(category__name__iexact=category)
                )

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
            cache.set(cache_key, payload, CACHE_TTL_SECONDS)

        return etag_response(request, payload, cache_control=PUBLIC_CACHE_CONTROL)


class PublicArticleDetailView(PublicApiView):
    def get(self, request, slug):
        cache_key = f"publicapi:article:{slug}"
        payload = cache.get(cache_key)

        if payload is None:
            article = get_object_or_404(published_articles(), slug=slug)
            payload = ArticleSerializer(article).data
            cache.set(cache_key, payload, CACHE_TTL_SECONDS)

        return etag_response(request, payload, cache_control=PUBLIC_DETAIL_CACHE_CONTROL)


class PublicBriefListView(PublicApiView):
    def get(self, request):
        cursor = request.query_params.get("cursor", "").strip()
        limit = _parse_limit(request.query_params.get("limit"))

        cache_key = f"publicapi:briefs:{cursor}:{limit}"
        payload = cache.get(cache_key)

        if payload is None:
            queryset = Brief.objects.filter(is_active=True)
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
            cache.set(cache_key, payload, CACHE_TTL_SECONDS)

        return etag_response(request, payload, cache_control=PUBLIC_CACHE_CONTROL)


class PublicCategoryListView(PublicApiView):
    def get(self, request):
        cache_key = "publicapi:categories"
        payload = cache.get(cache_key)

        if payload is None:
            queryset = Category.objects.filter(is_active=True)
            payload = {"items": CategorySerializer(queryset, many=True).data}
            cache.set(cache_key, payload, CACHE_TTL_SECONDS * 10)

        return etag_response(
            request,
            payload,
            cache_control="public, max-age=3600, stale-while-revalidate=86400",
        )


class PublicSitemapDataView(PublicApiView):
    """Lightweight slug+date listing consumed by the web server's sitemap routes."""

    def get(self, request):
        cache_key = "publicapi:sitemap"
        payload = cache.get(cache_key)

        if payload is None:
            rows = published_articles().values("slug", "title", "published_at", "updated_at")[:5000]
            payload = {
                "items": [
                    {
                        "slug": row["slug"],
                        "title": row["title"],
                        "publishedAt": row["published_at"].isoformat(),
                        "updatedAt": row["updated_at"].isoformat(),
                    }
                    for row in rows
                ]
            }
            cache.set(cache_key, payload, CACHE_TTL_SECONDS * 5)

        return etag_response(request, payload, cache_control=PUBLIC_CACHE_CONTROL)
