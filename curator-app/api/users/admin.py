from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from users.models import User, UserIdentity


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = (
        "email",
        "display_name",
        "status",
        "is_staff",
        "is_active",
        "member_since",
    )
    search_fields = ("email", "display_name", "firebase_uid")
    readonly_fields = ("id", "created_at", "updated_at", "member_since", "last_login_at")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Profile",
            {
                "fields": (
                    "id",
                    "firebase_uid",
                    "display_name",
                    "avatar_url",
                    "status",
                    "email_verified_at",
                    "member_since",
                    "last_login_at",
                    "created_at",
                    "updated_at",
                )
            },
        ),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "is_staff", "is_active"),
            },
        ),
    )


@admin.register(UserIdentity)
class UserIdentityAdmin(admin.ModelAdmin):
    list_display = ("user", "provider", "provider_email", "provider_uid")
    search_fields = ("user__email", "provider_email", "provider_uid")

# Register your models here.
