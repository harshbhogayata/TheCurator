from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

# Machine-readable error codes aligned with API_CONTRACT.md §0.7
AUTHENTICATION_REQUIRED = "authentication_required"
AUTHENTICATION_INVALID = "authentication_invalid"
PERMISSION_DENIED = "permission_denied"
NOT_FOUND = "not_found"
VALIDATION_ERROR = "validation_error"
RATE_LIMITED = "rate_limited"
IDEMPOTENCY_CONFLICT = "idempotency_conflict"
INVALID_CURSOR = "invalid_cursor"
ENTITLEMENT_REQUIRED = "entitlement_required"
REAUTH_REQUIRED = "reauth_required"
SERVER_ERROR = "server_error"
SERVICE_UNAVAILABLE = "service_unavailable"


class EntitlementRequired(exceptions.PermissionDenied):
    default_code = ENTITLEMENT_REQUIRED

    def __init__(self, required_tier: str):
        super().__init__(detail=f"{required_tier} tier required")
        self.required_tier = required_tier


class ReauthRequired(exceptions.PermissionDenied):
    default_code = REAUTH_REQUIRED

    def __init__(self):
        super().__init__(detail="Re-authentication required. Please sign in again to continue.")


class IdempotencyConflict(exceptions.APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = IDEMPOTENCY_CONFLICT
    default_detail = "An idempotent request with this key and a different body already exists."


class InvalidCursor(exceptions.ValidationError):
    default_code = INVALID_CURSOR
    default_detail = "The cursor value is invalid or has expired."


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is None:
        return None

    code = getattr(exc, "default_code", SERVER_ERROR)

    if isinstance(exc, exceptions.NotAuthenticated):
        code = AUTHENTICATION_REQUIRED
    elif isinstance(exc, exceptions.AuthenticationFailed):
        code = AUTHENTICATION_INVALID
    elif isinstance(exc, exceptions.PermissionDenied):
        code = getattr(exc, "default_code", PERMISSION_DENIED)
    elif isinstance(exc, exceptions.NotFound):
        code = NOT_FOUND
    elif isinstance(exc, exceptions.ValidationError):
        code = getattr(exc, "default_code", VALIDATION_ERROR)
    elif isinstance(exc, exceptions.Throttled):
        code = RATE_LIMITED
        response["Retry-After"] = str(int(exc.wait or 60))

    detail = response.data.get("detail", str(exc))
    if isinstance(detail, list):
        detail = detail[0] if detail else str(exc)
    detail = str(detail)

    body = {"detail": detail, "code": code}

    if isinstance(exc, exceptions.ValidationError) and isinstance(response.data, dict):
        fields = {k: v for k, v in response.data.items() if k != "detail"}
        if fields:
            body["fields"] = fields

    if isinstance(exc, EntitlementRequired):
        body["requiredTier"] = exc.required_tier

    response.data = body
    return response
