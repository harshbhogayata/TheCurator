from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils import timezone

from common.models import UUIDPrimaryKeyModel
from users.managers import UserManager


class UserStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    SUSPENDED = "suspended", "Suspended"


class IdentityProvider(models.TextChoices):
    EMAIL = "email", "Email"
    GOOGLE = "google", "Google"
    APPLE = "apple", "Apple"


class User(UUIDPrimaryKeyModel, AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    firebase_uid = models.CharField(max_length=128, unique=True, null=True, blank=True)
    display_name = models.CharField(max_length=120, blank=True)
    avatar_url = models.URLField(blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=32,
        choices=UserStatus.choices,
        default=UserStatus.ACTIVE,
    )
    member_since = models.DateTimeField(default=timezone.now)
    last_login_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email


class UserIdentity(UUIDPrimaryKeyModel):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="identities")
    provider = models.CharField(max_length=32, choices=IdentityProvider.choices)
    provider_uid = models.CharField(max_length=255, blank=True)
    provider_email = models.EmailField(blank=True)

    class Meta:
        ordering = ["provider"]
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "provider_uid"],
                name="users_identity_provider_uid_unique",
            ),
            models.UniqueConstraint(
                fields=["user", "provider"],
                name="users_identity_user_provider_unique",
            ),
        ]

    def __str__(self):
        return f"{self.user.email} · {self.provider}"
