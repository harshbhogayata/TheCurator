from django.contrib import admin

from mobileapi.models import (
    Article,
    Brief,
    Category,
    DataExportRequest,
    FeedbackReport,
    IdempotencyKey,
    RevenueCatWebhookEvent,
    UserCollection,
    UserCollectionArticle,
    UserDevice,
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
    list_display = (
        "user",
        "tier",
        "revenuecat_customer_id",
        "qa_override_enabled",
        "qa_override_tier",
        "updated_at",
    )
    search_fields = ("user__email",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("slug", "name", "rank", "is_active")
    list_filter = ("is_active",)
    search_fields = ("slug", "name")


@admin.register(UserDevice)
class UserDeviceAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "app_version", "last_seen", "is_active")
    list_filter = ("platform", "is_active")
    search_fields = ("user__email", "expo_push_token")


@admin.register(FeedbackReport)
class FeedbackReportAdmin(admin.ModelAdmin):
    list_display = ("user", "category", "app_version", "created_at")
    list_filter = ("category",)
    search_fields = ("user__email", "message")


@admin.register(DataExportRequest)
class DataExportRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "status", "created_at", "expires_at")
    list_filter = ("status",)
    search_fields = ("user__email",)


@admin.register(IdempotencyKey)
class IdempotencyKeyAdmin(admin.ModelAdmin):
    list_display = ("user", "key", "request_method", "response_status", "expires_at")
    search_fields = ("user__email", "key", "request_path")


@admin.register(RevenueCatWebhookEvent)
class RevenueCatWebhookEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "event_id", "app_user_id", "store", "environment", "created_at")
    search_fields = ("event_id", "app_user_id", "user__email")
    list_filter = ("event_type", "store", "environment")
