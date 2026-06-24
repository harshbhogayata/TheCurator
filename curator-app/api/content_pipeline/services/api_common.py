"""Shared helpers for news API provider fetchers."""

from __future__ import annotations

from datetime import datetime, timezone as dt_timezone
from urllib.parse import parse_qs, urlparse


def parse_source_config(source) -> dict[str, str]:
    """Read query params from provider://endpoint?key=value or https://host/path?..."""
    url = (source.url or "").strip()
    parsed = urlparse(url)
    return {key: values[0] for key, values in parse_qs(parsed.query).items() if values}


def parse_iso_datetime(raw_value) -> datetime | None:
    if not raw_value:
        return None
    try:
        published = datetime.fromisoformat(str(raw_value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if published.tzinfo is None:
        published = published.replace(tzinfo=dt_timezone.utc)
    return published


def normalize_entry(
    *,
    external_id: str = "",
    url: str = "",
    title: str = "",
    summary: str = "",
    author: str = "",
    image_url: str = "",
    published_at=None,
) -> dict:
    return {
        "external_id": external_id,
        "url": url.strip(),
        "title": title.strip(),
        "summary": summary.strip(),
        "author": author.strip(),
        "image_url": image_url.strip(),
        "published_at": published_at,
    }
