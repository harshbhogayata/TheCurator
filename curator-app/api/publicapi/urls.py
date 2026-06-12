from django.urls import path

from publicapi import views

app_name = "publicapi"

urlpatterns = [
    path("articles", views.PublicArticleListView.as_view(), name="article-list"),
    path("articles/<slug:slug>", views.PublicArticleDetailView.as_view(), name="article-detail"),
    path("briefs", views.PublicBriefListView.as_view(), name="brief-list"),
    path("categories", views.PublicCategoryListView.as_view(), name="category-list"),
    path("sitemap-data", views.PublicSitemapDataView.as_view(), name="sitemap-data"),
]
