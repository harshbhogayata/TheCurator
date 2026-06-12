import base64
import json
from datetime import date, datetime
from typing import Optional, Tuple


def encode_cursor(published_at: date, rank: int, record_id: str) -> str:
    payload = {"pub": published_at.isoformat(), "rank": int(rank), "id": str(record_id)}
    return base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode()


def decode_cursor(cursor: str) -> Optional[Tuple[date, int, str]]:
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        raw = base64.urlsafe_b64decode(padded.encode()).decode()
        data = json.loads(raw)
        return date.fromisoformat(data["pub"]), int(data.get("rank", 0)), data["id"]
    except Exception:
        return None


class CursorPage:
    """
    Wraps a queryset slice into the wire format:
      { "items": [...serialized...], "nextCursor": "<str|null>" }

    Usage:
        page = CursorPage(queryset, limit, cursor_str)
        page.apply()          # slices queryset
        page.serialize(Serializer)  # returns response dict
    """

    def __init__(self, queryset, limit: int, cursor_str: str):
        self.queryset = queryset
        self.limit = max(1, min(limit, 50))
        self.cursor_str = cursor_str
        self._items = None
        self._next_cursor = None
        self._invalid = False

    def apply(self) -> "CursorPage":
        if self.cursor_str:
            decoded = decode_cursor(self.cursor_str)
            if decoded is None:
                self._invalid = True
                return self
            cursor_date, cursor_rank, cursor_id = decoded
            from django.db.models import Q
            self.queryset = self.queryset.filter(
                Q(published_at__lt=cursor_date)
                | Q(published_at=cursor_date, rank__gt=cursor_rank)
                | Q(published_at=cursor_date, rank=cursor_rank, id__gt=cursor_id)
            )

        self.queryset = self.queryset.order_by("-published_at", "rank", "id")
        raw = list(self.queryset[: self.limit + 1])
        has_next = len(raw) > self.limit
        self._items = raw[: self.limit]

        if has_next and self._items:
            last = self._items[-1]
            self._next_cursor = encode_cursor(last.published_at, getattr(last, "rank", 0), last.id)
        else:
            self._next_cursor = None

        return self

    @property
    def invalid(self) -> bool:
        return self._invalid

    def serialize(self, serializer_class, context=None):
        kwargs = {"many": True}
        if context:
            kwargs["context"] = context
        return {
            "items": serializer_class(self._items, **kwargs).data,
            "nextCursor": self._next_cursor,
        }
