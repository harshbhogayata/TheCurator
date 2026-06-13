from django.db import models

from common.models import UUIDPrimaryKeyModel


class LaunchNotifySignup(UUIDPrimaryKeyModel):
    email = models.EmailField(max_length=254, unique=True, db_index=True)
    source = models.CharField(max_length=64, blank=True, default="launch_site")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "launch notify signup"
        verbose_name_plural = "launch notify signups"

    def __str__(self):
        return self.email
