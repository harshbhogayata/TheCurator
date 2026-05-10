import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models
import django.utils.timezone
from django.utils.text import slugify

CONTENT_CATEGORIES = [
    {"slug": "economy", "name": "Economy", "color": "#0f766e", "icon": "line-chart", "rank": 0},
    {"slug": "technology", "name": "Technology", "color": "#1d4ed8", "icon": "cpu", "rank": 1},
    {"slug": "climate", "name": "Climate", "color": "#15803d", "icon": "leaf", "rank": 2},
    {"slug": "culture", "name": "Culture", "color": "#a16207", "icon": "palette", "rank": 3},
    {"slug": "health", "name": "Health", "color": "#be123c", "icon": "heart-pulse", "rank": 4},
    {"slug": "politics", "name": "Politics", "color": "#7c2d12", "icon": "landmark", "rank": 5},
    {"slug": "science", "name": "Science", "color": "#6d28d9", "icon": "flask-conical", "rank": 6},
]


def populate_article_slugs(apps, schema_editor):
    Article = apps.get_model("mobileapi", "Article")

    for article in Article.objects.all().order_by("created_at", "id"):
        if article.slug:
            continue

        base_slug = slugify(article.title)[:260] or str(article.id)
        slug = base_slug
        suffix = 2
        while Article.objects.exclude(pk=article.pk).filter(slug=slug).exists():
            suffix_str = f"-{suffix}"
            slug = f"{base_slug[: max(1, 280 - len(suffix_str))]}{suffix_str}"
            suffix += 1

        article.slug = slug
        article.save(update_fields=["slug"])


def seed_content_categories(apps, schema_editor):
    Category = apps.get_model("mobileapi", "Category")

    for category in CONTENT_CATEGORIES:
        Category.objects.update_or_create(
            slug=category["slug"],
            defaults={
                "name": category["name"],
                "color": category["color"],
                "icon": category["icon"],
                "rank": category["rank"],
                "is_active": True,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("mobileapi", "0002_seed_content"),
    ]

    operations = [
        migrations.CreateModel(
            name="Category",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("slug", models.CharField(max_length=32, unique=True)),
                ("name", models.CharField(max_length=64)),
                ("color", models.CharField(default="#64748b", max_length=16)),
                ("icon", models.CharField(default="layers", max_length=64)),
                ("rank", models.PositiveSmallIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ["rank", "name"]},
        ),
        migrations.CreateModel(
            name="DataExportRequest",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("completed", "Completed"), ("failed", "Failed")],
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("download_url", models.URLField(blank=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="data_export_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="FeedbackReport",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "category",
                    models.CharField(
                        choices=[("bug", "Bug"), ("idea", "Idea"), ("other", "Other")],
                        max_length=16,
                    ),
                ),
                ("message", models.TextField()),
                ("app_version", models.CharField(blank=True, max_length=32)),
                ("os_version", models.CharField(blank=True, max_length=64)),
                ("attach_diagnostics", models.BooleanField(default=False)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="feedback_reports",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="IdempotencyKey",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("key", models.CharField(max_length=128)),
                ("request_method", models.CharField(max_length=10)),
                ("request_path", models.CharField(max_length=255)),
                ("request_fingerprint", models.CharField(max_length=64)),
                ("response_status", models.PositiveSmallIntegerField()),
                ("response_body", models.JSONField(blank=True, default=dict)),
                ("expires_at", models.DateTimeField()),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="idempotency_keys",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="UserDevice",
            fields=[
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("expo_push_token", models.CharField(max_length=255)),
                ("platform", models.CharField(choices=[("ios", "iOS"), ("android", "Android"), ("web", "Web")], max_length=16)),
                ("app_version", models.CharField(blank=True, max_length=32)),
                ("last_seen", models.DateTimeField(default=django.utils.timezone.now)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mobile_devices",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-last_seen"]},
        ),
        migrations.AddField(
            model_name="article",
            name="image_attribution",
            field=models.CharField(blank=True, default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="article",
            name="image_source_url",
            field=models.URLField(blank=True, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="article",
            name="image_url",
            field=models.URLField(blank=True, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="article",
            name="slug",
            field=models.SlugField(blank=True, max_length=280, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="brief",
            name="image_attribution",
            field=models.CharField(blank=True, default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="brief",
            name="is_breaking",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="userentitlement",
            name="expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="userentitlement",
            name="product_id",
            field=models.CharField(blank=True, default="", max_length=128),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="userentitlement",
            name="will_renew",
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name="idempotencykey",
            constraint=models.UniqueConstraint(fields=("user", "key"), name="mobileapi_idempotency_user_key_unique"),
        ),
        migrations.AddConstraint(
            model_name="userdevice",
            constraint=models.UniqueConstraint(
                fields=("user", "expo_push_token"),
                name="mobileapi_device_user_token_unique",
            ),
        ),
        migrations.RunPython(seed_content_categories, migrations.RunPython.noop),
        migrations.RunPython(populate_article_slugs, migrations.RunPython.noop),
    ]
