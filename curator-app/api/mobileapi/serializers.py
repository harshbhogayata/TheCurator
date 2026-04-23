from rest_framework import serializers

from mobileapi.models import (
    Article,
    Brief,
    SubscriptionTier,
    UserCollection,
    UserEntitlement,
)


def _format_date(value):
    return value.strftime("%B %d, %Y").replace(" 0", " ")


class ArticleSerializer(serializers.ModelSerializer):
    readTime = serializers.SerializerMethodField()
    publishedDate = serializers.SerializerMethodField()
    imageQuery = serializers.CharField(source="image_query")
    audioUrl = serializers.CharField(source="audio_url", allow_blank=True)
    audioDurationSec = serializers.IntegerField(source="audio_duration_sec", allow_null=True)

    class Meta:
        model = Article
        fields = (
            "id",
            "title",
            "excerpt",
            "category",
            "readTime",
            "publishedDate",
            "author",
            "sources",
            "imageQuery",
            "content",
            "audioUrl",
            "audioDurationSec",
        )

    def get_readTime(self, obj):
        return f"{obj.read_time_minutes} min read"

    def get_publishedDate(self, obj):
        return _format_date(obj.published_at)


class BriefSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()
    durationMs = serializers.SerializerMethodField()
    publishedDate = serializers.SerializerMethodField()
    imageUrl = serializers.CharField(source="image_url", allow_blank=True)
    audioUrl = serializers.CharField(source="audio_url", allow_blank=True)

    class Meta:
        model = Brief
        fields = (
            "id",
            "title",
            "summary",
            "duration",
            "durationMs",
            "publishedDate",
            "imageUrl",
            "audioUrl",
            "category",
            "insights",
        )

    def get_duration(self, obj):
        return f"{obj.duration_minutes} min"

    def get_durationMs(self, obj):
        return obj.duration_minutes * 60 * 1000

    def get_publishedDate(self, obj):
        return _format_date(obj.published_at)


class SavedArticleWriteSerializer(serializers.Serializer):
    articleId = serializers.UUIDField()


class CollectionSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at")
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
    readTimeMs = serializers.IntegerField(min_value=0)


class EntitlementSerializer(serializers.ModelSerializer):
    effectiveTier = serializers.CharField(source="effective_tier", read_only=True)

    class Meta:
        model = UserEntitlement
        fields = ("tier", "qa_override_enabled", "qa_override_tier", "effectiveTier")


class EntitlementUpdateSerializer(serializers.Serializer):
    tier = serializers.ChoiceField(choices=SubscriptionTier.choices)
