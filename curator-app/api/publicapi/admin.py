from django.contrib import admin

from publicapi.models import LaunchNotifySignup


@admin.register(LaunchNotifySignup)
class LaunchNotifySignupAdmin(admin.ModelAdmin):
    list_display = ("email", "source", "created_at")
    list_filter = ("source",)
    search_fields = ("email",)
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)
