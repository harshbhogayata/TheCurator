import logging
import threading
import time
import uuid

from django.utils.deprecation import MiddlewareMixin

_request_id_local = threading.local()


def get_request_id() -> str:
    return getattr(_request_id_local, "request_id", "")


class RequestIdMiddleware(MiddlewareMixin):
    """
    Reads cf-ray from Cloudflare if present; otherwise generates uuid4.
    Attaches to response as X-Request-ID and to thread-local for log access.
    """

    def process_request(self, request):
        request_id = request.headers.get("Cf-Ray") or str(uuid.uuid4())
        _request_id_local.request_id = request_id
        request.request_id = request_id

    def process_response(self, request, response):
        request_id = getattr(request, "request_id", get_request_id())
        if request_id:
            response["X-Request-ID"] = request_id
        return response


_SCRUB_FIELDS = frozenset(
    {"authorization", "password", "token", "email", "access_token", "refresh_token"}
)
_SCRUBBED = "[REDACTED]"


class SensitiveLogFilter(logging.Filter):
    """
    Strips PII and auth tokens from log record dicts.
    Attached to the root logger in settings.LOGGING.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if hasattr(record, "request"):
            req = record.request
            if hasattr(req, "META"):
                if "HTTP_AUTHORIZATION" in req.META:
                    req.META["HTTP_AUTHORIZATION"] = _SCRUBBED
        for attr in ("msg", "getMessage"):
            if attr == "getMessage":
                continue
            msg = getattr(record, attr, None)
            if isinstance(msg, str):
                for field in _SCRUB_FIELDS:
                    if field in msg.lower():
                        setattr(record, attr, _SCRUBBED)
                        record.args = ()
                        break
        return True


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Emits a single structured log line per request with whitelisted fields only:
    ts, level, msg, request_id, user_id, method, path, status, duration_ms, ua_family
    """

    logger = logging.getLogger("curator.requests")

    def process_request(self, request):
        request._start_time = time.monotonic()

    def process_response(self, request, response):
        duration_ms = round((time.monotonic() - request._start_time) * 1000) if hasattr(request, "_start_time") else 0

        user_id = None
        if hasattr(request, "user") and request.user and request.user.is_authenticated:
            user_id = str(request.user.id)

        ua = request.META.get("HTTP_USER_AGENT", "")[:80]

        self.logger.info(
            "request",
            extra={
                "request_id": getattr(request, "request_id", ""),
                "user_id": user_id,
                "method": request.method,
                "path": request.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "ua_family": ua,
            },
        )
        return response
