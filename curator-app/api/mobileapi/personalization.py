"""Personalized feed ranking and full-text search helpers."""

from datetime import timedelta

from django.db import connection
from django.db.models import Q
from django.utils import timezone

READING_HISTORY_DAYS = 30


def _postgres():
    return connection.vendor == "postgresql"


def build_search_filter(query):
    """Postgres full-text search filter (with icontains for partial words).

    Falls back to plain icontains on non-Postgres databases (local SQLite dev).
    """
    if not _postgres():
        return Q(title__icontains=query) | Q(excerpt__icontains=query)

    from django.contrib.postgres.search import SearchQuery

    search_query = SearchQuery(query, search_type="websearch", config="english")
    return Q(article_search=search_query) | Q(title__icontains=query)


def annotate_search(queryset):
    if not _postgres():
        return queryset

    from django.contrib.postgres.search import SearchVector

    # Matches the expression GIN index created in mobileapi migration 0010 so
    # Postgres can serve full-text queries from the index.
    return queryset.annotate(
        article_search=SearchVector("title", "excerpt", "content", config="english")
    )


def personalized_category_slugs(user):
    """Category slugs for the For You feed: explicit prefs + reading history."""
    from onboarding.models import UserCategoryPreference
    from mobileapi.models import UserReadingEvent

    preferred = set(
        UserCategoryPreference.objects.filter(user=user).values_list(
            "category_key", flat=True
        )
    )

    since = timezone.now() - timedelta(days=READING_HISTORY_DAYS)
    history = (
        UserReadingEvent.objects.filter(
            user=user,
            created_at__gte=since,
            article__isnull=False,
        )
        .values_list("article__category__slug", flat=True)
        .distinct()
    )
    preferred.update(slug for slug in history if slug)
    return preferred
