import json
import logging
from pathlib import Path

from django.conf import settings
from django.core import signing
from django.urls import reverse
from django.utils import timezone

from mobileapi.models import DataExportRequest, ExportStatus
from mobileapi.serializers import CollectionSerializer, DataExportSerializer, EntitlementSerializer, FeedbackSerializer
from onboarding.models import UserCategoryPreference, UserOnboarding, UserPreference
from users.models import UserIdentity
from users.serializers import (
    UserIdentitySerializer,
    UserOnboardingSerializer,
    UserPreferencesSerializer,
    UserProfileSerializer,
)


logger = logging.getLogger(__name__)
EXPORT_SIGNING_SALT = "mobileapi.privacy-export"


def export_storage_dir() -> Path:
    path = Path(settings.DATA_EXPORT_STORAGE_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def export_file_path(export_request: DataExportRequest) -> Path:
    user_dir = export_storage_dir() / str(export_request.user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir / f"{export_request.id}.json"


def build_download_token(export_request: DataExportRequest) -> str:
    return signing.dumps(
        {"export_id": str(export_request.id), "user_id": str(export_request.user_id)},
        salt=EXPORT_SIGNING_SALT,
    )


def validate_download_token(export_request: DataExportRequest, token: str) -> bool:
    if not token:
        return False
    try:
        max_age = getattr(settings, "DATA_EXPORT_EXPIRY_HOURS", 24) * 3600
        payload = signing.loads(token, salt=EXPORT_SIGNING_SALT, max_age=max_age)
    except signing.BadSignature:
        return False

    return payload == {"export_id": str(export_request.id), "user_id": str(export_request.user_id)}


def build_export_download_url(export_request: DataExportRequest) -> str:
    token = build_download_token(export_request)
    path = reverse("api:v1:privacy-export-download", kwargs={"export_id": export_request.id})
    base_url = settings.API_PUBLIC_BASE_URL.rstrip("/")
    return f"{base_url}{path}?token={token}"


def _serialize_saved_articles(user):
    saved_rows = user.saved_articles.select_related("article").order_by("-created_at")
    return [
        {
            "savedAt": saved.created_at.isoformat(),
            "article": {
                "id": str(saved.article_id),
                "title": saved.article.title,
                "category": saved.article.category.slug if saved.article.category else "",
                "publishedAt": saved.article.published_at.isoformat(),
            },
        }
        for saved in saved_rows
    ]


def _serialize_reading_events(user):
    return [
        {
            "id": str(event.id),
            "articleId": str(event.article_id) if event.article_id else None,
            "readTimeMs": event.read_time_ms,
            "eventDate": event.event_date.isoformat(),
            "createdAt": event.created_at.isoformat(),
        }
        for event in user.reading_events.select_related("article").order_by("-created_at")
    ]


def _serialize_export_requests(user):
    return [
        {
            "id": str(export_request.id),
            "status": export_request.status,
            "createdAt": export_request.created_at.isoformat(),
            "expiresAt": export_request.expires_at.isoformat() if export_request.expires_at else None,
        }
        for export_request in user.data_export_requests.order_by("-created_at")
    ]


def build_export_payload(export_request: DataExportRequest):
    user = export_request.user
    onboarding, _ = UserOnboarding.objects.get_or_create(user=user)
    preferences, _ = UserPreference.objects.get_or_create(user=user)
    collections = user.mobile_collections.prefetch_related("collection_items").order_by("-updated_at")
    identities = UserIdentity.objects.filter(user=user).order_by("provider")
    feedback_reports = user.feedback_reports.order_by("-created_at")
    entitlement = getattr(user, "entitlement", None)

    return {
        "generatedAt": timezone.now().isoformat(),
        "request": DataExportSerializer(export_request).data,
        "user": UserProfileSerializer(user).data,
        "identities": UserIdentitySerializer(identities, many=True).data,
        "onboarding": UserOnboardingSerializer(onboarding).data,
        "preferences": UserPreferencesSerializer(preferences).data,
        "selectedCategoryKeys": list(
            UserCategoryPreference.objects.filter(user=user).order_by("category_key").values_list("category_key", flat=True)
        ),
        "savedArticles": _serialize_saved_articles(user),
        "collections": CollectionSerializer(collections, many=True).data,
        "readingEvents": _serialize_reading_events(user),
        "feedbackReports": FeedbackSerializer(feedback_reports, many=True).data,
        "entitlement": EntitlementSerializer(entitlement).data if entitlement else None,
        "dataExportRequests": _serialize_export_requests(user),
    }


def generate_data_export(export_request_id):
    export_request = DataExportRequest.objects.select_related("user").get(id=export_request_id)

    try:
        payload = build_export_payload(export_request)
        destination = export_file_path(export_request)
        destination.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")

        export_request.status = ExportStatus.COMPLETED
        export_request.expires_at = timezone.now() + timezone.timedelta(hours=settings.DATA_EXPORT_EXPIRY_HOURS)
        export_request.download_url = build_export_download_url(export_request)
        export_request.save(update_fields=["status", "expires_at", "download_url", "updated_at"])
    except Exception:
        logger.exception("Failed to generate data export for request %s", export_request_id)
        export_request.status = ExportStatus.FAILED
        export_request.save(update_fields=["status", "updated_at"])
        raise
