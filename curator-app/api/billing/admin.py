from django.contrib import admin

from billing.models import RazorpayWebhookEvent, StripeWebhookEvent


@admin.register(StripeWebhookEvent)
class StripeWebhookEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "event_id", "user", "created_at")
    list_filter = ("event_type",)
    search_fields = ("event_id", "user__email")
    readonly_fields = ("event_id", "event_type", "payload", "user", "created_at", "updated_at")

    def has_add_permission(self, request):
        return False


@admin.register(RazorpayWebhookEvent)
class RazorpayWebhookEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "event_id", "user", "created_at")
    list_filter = ("event_type",)
    search_fields = ("event_id", "user__email")
    readonly_fields = ("event_id", "event_type", "payload", "user", "created_at", "updated_at")

    def has_add_permission(self, request):
        return False
