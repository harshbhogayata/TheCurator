from datetime import UTC, datetime, time

from django.utils import timezone
from rest_framework import serializers

from mobileapi.source_links import resolve_source_links
from onboarding.models import UserPreference
from mobileapi.models import (
    Article,
    ArticleStatus,
    Brief,
    Category,
    DataExportRequest,
    DevicePlatform,
    FeedbackCategory,
    FeedbackReport,
    SubscriptionTier,
    UserCollection,
    UserDevice,
    UserEntitlement,
)


def _format_date(value):
    return value.strftime("%B %d, %Y").replace(" 0", " ")


def _as_utc_start_of_day(value):
    aware = datetime.combine(value, time.min, tzinfo=UTC)
    return aware.isoformat().replace("+00:00", "Z")


class ArticleSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field="slug", queryset=Category.objects.all())
    slug = serializers.CharField(read_only=True)
    readTime = serializers.SerializerMethodField()
    readTimeMinutes = serializers.IntegerField(source="read_time_minutes")
    publishedDate = serializers.SerializerMethodField()
    publishedAt = serializers.SerializerMethodField()
    imageQuery = serializers.CharField(source="image_query")
    imageUrl = serializers.CharField(source="image_url", allow_blank=True)
    imageSourceUrl = serializers.CharField(source="image_source_url", allow_blank=True)
    imageAttribution = serializers.CharField(source="image_attribution", allow_blank=True)
    audioUrl = serializers.SerializerMethodField()
    audioDurationSec = serializers.SerializerMethodField()
    hasAudioAvailable = serializers.SerializerMethodField()
    relatedArticleIds = serializers.SerializerMethodField()
    sourceLinks = serializers.SerializerMethodField()
    topics = serializers.JSONField(read_only=True)

    class Meta:
        model = Article
        fields = (
            "id",
            "title",
            "excerpt",
            "category",
            "slug",
            "readTime",
            "readTimeMinutes",
            "publishedDate",
            "publishedAt",
            "author",
            "sources",
            "sourceLinks",
            "topics",
            "imageQuery",
            "imageUrl",
            "imageSourceUrl",
            "imageAttribution",
            "content",
            "audioUrl",
            "audioDurationSec",
            "hasAudioAvailable",
            "relatedArticleIds",
        )

    def get_readTime(self, obj):
        return f"{obj.read_time_minutes} min read"

    def get_publishedDate(self, obj):
        return _format_date(obj.published_at)

    def get_publishedAt(self, obj):
        return _as_utc_start_of_day(obj.published_at)

    def get_audioUrl(self, obj):
        return ""

    def get_audioDurationSec(self, obj):
        if not obj.audio_url:
            return None
        return obj.audio_duration_sec

    def get_hasAudioAvailable(self, obj):
        if obj.audio_url:
            return True
        return bool((obj.content or obj.excerpt or "").strip())

    def get_sourceLinks(self, obj):
        return resolve_source_links(obj.source_links, obj.sources)

    def get_relatedArticleIds(self, obj):
        # Prefer related articles precomputed from embeddings at publish time.
        if obj.related_article_ids:
            valid_ids = Article.objects.filter(
                id__in=obj.related_article_ids,
                is_active=True,
                status=ArticleStatus.PUBLISHED,
            ).values_list("id", flat=True)
            ordered = [
                article_id
                for article_id in obj.related_article_ids
                if any(str(valid) == str(article_id) for valid in valid_ids)
            ]
            if ordered:
                return [str(article_id) for article_id in ordered[:3]]

        related_ids = (
            Article.objects.filter(
                is_active=True,
                status=ArticleStatus.PUBLISHED,
                category=obj.category,
            )
            .exclude(id=obj.id)
            .values_list("id", flat=True)[:3]
        )
        return [str(article_id) for article_id in related_ids]


class ArticleListSerializer(ArticleSerializer):
    class Meta(ArticleSerializer.Meta):
        fields = tuple(
            field for field in ArticleSerializer.Meta.fields if field not in {"content", "relatedArticleIds"}
        )


class BriefSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()
    durationMinutes = serializers.IntegerField(source="duration_minutes")
    durationMs = serializers.SerializerMethodField()
    publishedDate = serializers.SerializerMethodField()
    publishedAt = serializers.SerializerMethodField()
    imageUrl = serializers.CharField(source="image_url", allow_blank=True)
    imageAttribution = serializers.CharField(source="image_attribution", allow_blank=True)
    audioUrl = serializers.SerializerMethodField()
    hasAudioAvailable = serializers.SerializerMethodField()
    isBreaking = serializers.BooleanField(source="is_breaking")

    class Meta:
        model = Brief
        fields = (
            "id",
            "title",
            "summary",
            "duration",
            "durationMinutes",
            "durationMs",
            "publishedDate",
            "publishedAt",
            "imageUrl",
            "imageAttribution",
            "audioUrl",
            "hasAudioAvailable",
            "category",
            "insights",
            "isBreaking",
        )

    def get_audioUrl(self, obj):
        return ""

    def get_hasAudioAvailable(self, obj):
        if obj.audio_url:
            return True
        return bool((obj.summary or "").strip())

    def get_duration(self, obj):
        return f"{obj.duration_minutes} min"

    def get_durationMs(self, obj):
        if obj.audio_duration_sec:
            return obj.audio_duration_sec * 1000
        return obj.duration_minutes * 60 * 1000

    def get_publishedDate(self, obj):
        return _format_date(obj.published_at)

    def get_publishedAt(self, obj):
        return _as_utc_start_of_day(obj.published_at)


class SavedArticleWriteSerializer(serializers.Serializer):
    articleId = serializers.UUIDField()


class CollectionSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")
    updatedAt = serializers.DateTimeField(source="updated_at")
    articleIds = serializers.SerializerMethodField()

    class Meta:
        model = UserCollection
        fields = (
            "id",
            "name",
            "description",
            "color",
            "icon",
            "articleIds",
            "createdAt",
            "updatedAt",
        )

    def get_articleIds(self, obj):
        return [str(article_id) for article_id in obj.collection_items.values_list("article_id", flat=True)]


class CollectionCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    description = serializers.CharField(max_length=500, allow_blank=True, required=False, default="")
    color = serializers.RegexField(
        regex=r"^#?[0-9a-fA-F]{6}$",
        required=False,
        default="#6366f1",
    )
    icon = serializers.CharField(max_length=64, required=False, default="folder")

    def validate_color(self, value):
        return value if value.startswith("#") else f"#{value}"


class CollectionUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80, required=False)
    description = serializers.CharField(max_length=500, allow_blank=True, required=False)
    color = serializers.RegexField(regex=r"^#?[0-9a-fA-F]{6}$", required=False)
    icon = serializers.CharField(max_length=64, required=False)

    def validate_color(self, value):
        return value if value.startswith("#") else f"#{value}"


class CollectionItemWriteSerializer(serializers.Serializer):
    articleId = serializers.UUIDField()


class ReadingEventWriteSerializer(serializers.Serializer):
    articleId = serializers.UUIDField(required=False, allow_null=True)
    readTimeMs = serializers.IntegerField()

    def validate_readTimeMs(self, value):
        return max(500, min(value, 7_200_000))


class EntitlementSerializer(serializers.ModelSerializer):
    effectiveTier = serializers.CharField(source="effective_tier", read_only=True)
    productId = serializers.CharField(source="product_id", allow_blank=True)
    expiresAt = serializers.DateTimeField(source="expires_at", allow_null=True)
    willRenew = serializers.BooleanField(source="will_renew")
    qaOverrideEnabled = serializers.BooleanField(source="qa_override_enabled")
    qaOverrideTier = serializers.CharField(source="qa_override_tier", allow_blank=True)

    class Meta:
        model = UserEntitlement
        fields = (
            "tier",
            "effectiveTier",
            "productId",
            "expiresAt",
            "willRenew",
            "qaOverrideEnabled",
            "qaOverrideTier",
        )


class EntitlementQAOverrideSerializer(serializers.Serializer):
    enabled = serializers.BooleanField()
    tier = serializers.ChoiceField(
        choices=SubscriptionTier.choices,
        required=False,
        allow_blank=True,
        default="",
    )

    def validate(self, attrs):
        enabled = attrs["enabled"]
        tier = attrs.get("tier", "")

        if enabled and not tier:
            raise serializers.ValidationError(
                {"tier": "This field is required when QA override is enabled."}
            )

        if not enabled:
            attrs["tier"] = ""

        return attrs


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("slug", "name", "color", "icon", "rank")


class PreferenceSerializer(serializers.ModelSerializer):
    themePreference = serializers.CharField(source="theme_preference", required=False)
    notificationFrequency = serializers.CharField(source="notification_frequency", required=False)
    pushEnabled = serializers.BooleanField(source="push_enabled", required=False)
    emailDigestEnabled = serializers.BooleanField(source="email_digest_enabled", required=False)
    autoSaveEnabled = serializers.BooleanField(source="auto_save_enabled", required=False)
    textSize = serializers.CharField(source="text_size", required=False)
    reduceMotionEnabled = serializers.BooleanField(source="reduce_motion_enabled", required=False)

    class Meta:
        model = UserPreference
        fields = (
            "themePreference",
            "notificationFrequency",
            "pushEnabled",
            "emailDigestEnabled",
            "autoSaveEnabled",
            "textSize",
            "reduceMotionEnabled",
        )


class DeviceSerializer(serializers.ModelSerializer):
    deviceId = serializers.UUIDField(source="id", read_only=True)
    expoPushToken = serializers.CharField(source="expo_push_token")
    appVersion = serializers.CharField(source="app_version")
    lastSeen = serializers.DateTimeField(source="last_seen")

    class Meta:
        model = UserDevice
        fields = ("id", "deviceId", "expoPushToken", "platform", "appVersion", "lastSeen")


class DeviceWriteSerializer(serializers.Serializer):
    deviceId = serializers.UUIDField(required=False)
    expoPushToken = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
    platform = serializers.ChoiceField(choices=DevicePlatform.choices)
    appVersion = serializers.CharField(max_length=32, required=False, allow_blank=True, default="")
    # Web Push subscription JSON (platform=web only).
    webPushSubscription = serializers.JSONField(required=False)

    def validate(self, attrs):
        subscription = attrs.get("webPushSubscription") or {}
        if attrs.get("platform") == DevicePlatform.WEB:
            endpoint = subscription.get("endpoint") if isinstance(subscription, dict) else None
            if not endpoint:
                raise serializers.ValidationError(
                    {"webPushSubscription": "A subscription with an endpoint is required for web devices."}
                )
            if not attrs.get("expoPushToken"):
                # Stable identity for the device row: hash of the push endpoint.
                import hashlib

                attrs["expoPushToken"] = "webpush:" + hashlib.sha256(
                    endpoint.encode("utf-8")
                ).hexdigest()
        elif not attrs.get("expoPushToken"):
            raise serializers.ValidationError({"expoPushToken": "This field is required."})
        return attrs


class FeedbackCreateSerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=FeedbackCategory.choices)
    message = serializers.CharField(min_length=10, max_length=4000)
    appVersion = serializers.CharField(max_length=32, required=False, allow_blank=True, default="")
    osVersion = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")
    attachDiagnostics = serializers.BooleanField(required=False, default=False)


class FeedbackSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")

    class Meta:
        model = FeedbackReport
        fields = ("id", "createdAt")


class DataExportSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")
    downloadUrl = serializers.SerializerMethodField()

    class Meta:
        model = DataExportRequest
        fields = ("id", "status", "downloadUrl", "createdAt")

    def get_downloadUrl(self, obj):
        if obj.download_url and obj.expires_at and obj.expires_at > timezone.now():
            return obj.download_url
        return None
