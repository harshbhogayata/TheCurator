"""Currents API ingestion for India/regional news.

Docs: https://currentsapi.services/en/docs/latest_news
Free tier: 1,000 requests/day — tracked via Django cache.
"""

from __future__ import annotations

import logging
from datetime import date
from urllib.parse import parse_qs, urlparse

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CURRENTS_BASE_URL = "https://api.currentsapi.services/v1/latest-news"
# Maps Currents API category slugs → Curator category slugs (see /v1/available/categories).
CURRENTS_TO_CURATOR_CATEGORY = {
    "general": "news",
    "world": "news",
    "regional": "news",
    "politics": "politics",
    "opinion": "politics",
    "business": "economy",
    "finance": "economy",
    "economy": "economy",
    "trading": "economy",
    "commodity": "economy",
    "estate": "economy",
    "entrepreneur": "economy",
    "technology": "technology",
    "programming": "technology",
    "gadgets": "technology",
    "mobile": "technology",
    "security": "technology",
    "cs": "technology",
    "ee": "technology",
    "science": "science",
    "academia": "science",
    "academic": "science",
    "education": "science",
    "health": "health",
    "medical": "health",
    "environment": "climate",
    "energy": "climate",
    "culture": "culture",
    "entertainment": "culture",
    "art": "culture",
    "music": "culture",
    "movie": "culture",
    "television": "culture",
    "fashion": "culture",
    "food": "culture",
    "travel": "culture",
    "celebrity": "culture",
    "lifestyle": "culture",
    "sports": "news",
    "game": "culture",
    "auto": "technology",
    "design": "culture",
}


CACHE_KEY_PREFIX = "currents_requests"


def map_currents_category(currents_category: str) -> str:
    """Return a Curator category slug for a Currents category label."""
    key = (currents_category or "").strip().lower()
    return CURRENTS_TO_CURATOR_CATEGORY.get(key, "news")



def is_currents_source(source) -> bool:
    """True when a pipeline Source row represents Currents API."""
    url = (source.url or "").strip().lower()
    return url.startswith("currents://") or "currentsapi.services" in url


def _budget_cache_key() -> str:
    return f"{CACHE_KEY_PREFIX}:{date.today().isoformat()}"


def currents_budget_remaining() -> int:
    limit = int(getattr(settings, "CURRENTS_DAILY_REQUEST_BUDGET", 1000))
    used = int(cache.get(_budget_cache_key(), 0) or 0)
    return max(0, limit - used)


def _record_currents_request() -> None:
    key = _budget_cache_key()
    try:
        if cache.add(key, 1, timeout=86_400):
            return
        cache.incr(key)
    except Exception:
        # Cache optional — do not block ingest.
        pass


def _parse_currents_config(source) -> dict[str, str]:
    """Read language/country/category from currents://latest?language=en&country=IN."""
    url = (source.url or "").strip()
    if url.startswith("currents://"):
        parsed = urlparse(url)
        params = {k: v[0] for k, v in parse_qs(parsed.query).items() if v}
        return params

    parsed = urlparse(url)
    return {k: v[0] for k, v in parse_qs(parsed.query).items() if v}


def fetch_currents_entries(source) -> list[dict]:
    """Fetch latest news from Currents API. Returns normalized entry dicts."""
    api_key = getattr(settings, "CURRENTS_API_KEY", "")
    if not api_key:
        raise ValueError("CURRENTS_API_KEY is not configured.")

    if currents_budget_remaining() <= 0:
        logger.warning("Currents API daily request budget exhausted.")
        return []

    config = _parse_currents_config(source)
    params = {
        "apiKey": api_key,
        "language": config.get("language", getattr(settings, "CURRENTS_DEFAULT_LANGUAGE", "en")),
        "page_size": min(int(config.get("page_size", 30)), 100),
        "page_number": 1,
    }
    if config.get("country"):
        params["country"] = config["country"]
    if config.get("category"):
        params["category"] = config["category"]

    response = requests.get(
        CURRENTS_BASE_URL,
        params=params,
        headers={"Accept": "application/json", "User-Agent": "CuratorBot/1.0"},
        timeout=30,
    )
    response.raise_for_status()
    _record_currents_request()

    payload = response.json()
    if payload.get("status") != "ok":
        raise ValueError(f"Currents API error: {payload.get('message', payload)}")

    items = []
    for article in payload.get("news") or []:
        published = None
        raw_published = article.get("published")
        if raw_published:
            from datetime import datetime, timezone as dt_timezone

            try:
                published = datetime.fromisoformat(str(raw_published).replace("Z", "+00:00"))
                if published.tzinfo is None:
                    published = published.replace(tzinfo=dt_timezone.utc)
            except ValueError:
                published = None

        items.append(
            {
                "external_id": str(article.get("id", "")),
                "url": (article.get("url") or "").strip(),
                "title": (article.get("title") or "").strip(),
                "summary": (article.get("description") or "").strip(),
                "author": (article.get("author") or "").strip(),
                "image_url": (article.get("image") or "none") if article.get("image") != "none" else "",
                "published_at": published,
            }
        )
    return items
