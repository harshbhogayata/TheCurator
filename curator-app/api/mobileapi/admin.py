from django.contrib import admin

from mobileapi.models import (
    Article,
    Brief,
    UserCollection,
    UserCollectionArticle,
    UserEntitlement,
    UserReadingEvent,
    UserSavedArticle,
)


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "published_at", "read_time_minutes", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("title", "excerpt", "author")


@admin.register(Brief)
class BriefAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "published_at", "duration_minutes", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("title", "summary")


@admin.register(UserSavedArticle)
class UserSavedArticleAdmin(admin.ModelAdmin):
    list_display = ("user", "article", "created_at")
    search_fields = ("user__email", "article__title")


class UserCollectionArticleInline(admin.TabularInline):
    model = UserCollectionArticle
    extra = 0


@admin.register(UserCollection)
class UserCollectionAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "color", "updated_at")
    search_fields = ("name", "user__email")
    inlines = [UserCollectionArticleInline]


@admin.register(UserReadingEvent)
class UserReadingEventAdmin(admin.ModelAdmin):
    list_display = ("user", "article", "read_time_ms", "event_date", "created_at")
    search_fields = ("user__email", "article__title")
    list_filter = ("event_date",)


@admin.register(UserEntitlement)
class UserEntitlementAdmin(admin.ModelAdmin):
    list_display = ("user", "tier", "qa_override_enabled", "qa_override_tier", "updated_at")
    search_fields = ("user__email",)
