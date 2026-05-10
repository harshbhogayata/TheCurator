import hashlib
import json

from rest_framework.response import Response


def compute_etag(data) -> str:
    raw = json.dumps(data, sort_keys=True, default=str, separators=(",", ":"))
    digest = hashlib.sha1(raw.encode()).hexdigest()
    return f'W/"{digest}"'


def etag_response(request, data, status: int = 200, cache_control: str = "private, max-age=60, stale-while-revalidate=300") -> Response:
    etag = compute_etag(data)
    if request.headers.get("If-None-Match") == etag:
        return Response(status=304)
    resp = Response(data, status=status)
    resp["ETag"] = etag
    resp["Cache-Control"] = cache_control
    return resp
