from django.urls import path

from mobileapi.views import (
    ArticleDetailView,
    ArticleListView,
    BriefListView,
    CollectionArticleView,
    CollectionDetailView,
    CollectionListView,
    EntitlementView,
    ReadingEventView,
    ReadingStatsView,
    SavedArticleCollectionView,
    SavedArticleDetailView,
)

urlpatterns = [
    path("articles", ArticleListView.as_view(), name="mobile-v1-articles"),
    path("articles/<uuid:article_id>", ArticleDetailView.as_view(), name="mobile-v1-article-detail"),
    path("briefs", BriefListView.as_view(), name="mobile-v1-briefs"),
    path("saves", SavedArticleCollectionView.as_view(), name="mobile-v1-saves"),
    path("saves/<uuid:article_id>", SavedArticleDetailView.as_view(), name="mobile-v1-saves-detail"),
    path("collections", CollectionListView.as_view(), name="mobile-v1-collections"),
    path("collections/<uuid:collection_id>", CollectionDetailView.as_view(), name="mobile-v1-collection-detail"),
    path(
        "collections/<uuid:collection_id>/articles",
        CollectionArticleView.as_view(),
        name="mobile-v1-collection-articles",
    ),
    path(
        "collections/<uuid:collection_id>/articles/<uuid:article_id>",
        CollectionArticleView.as_view(),
        name="mobile-v1-collection-articles-detail",
    ),
    path("reading/stats", ReadingStatsView.as_view(), name="mobile-v1-reading-stats"),
    path("reading/events", ReadingEventView.as_view(), name="mobile-v1-reading-events"),
    path("entitlements", EntitlementView.as_view(), name="mobile-v1-entitlements"),
]
