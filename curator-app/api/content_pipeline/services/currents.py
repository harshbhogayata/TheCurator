"""Currents API ingestion for India/regional news.

Docs: https://currentsapi.services/en/docs/latest_news
Free tier: 1,000 requests/day — tracked via Django cache.
"""

from __future__ import annotations

import logging

import requests
from django.conf import settings

from content_pipeline.services.api_budget import budget_remaining, record_request
from content_pipeline.services.api_common import normalize_entry, parse_iso_datetime, parse_source_config

logger = logging.getLogger(__name__)

CURRENTS_BASE_URL = "https://api.currentsapi.services/v1/latest-news"
PROVIDER = "currents"
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


def currents_budget_remaining() -> int:
    limit = int(getattr(settings, "CURRENTS_DAILY_REQUEST_BUDGET", 1000))
    return budget_remaining(PROVIDER, limit)


def map_currents_category(currents_category: str) -> str:
    """Return a Curator category slug for a Currents category label."""
    key = (currents_category or "").strip().lower()
    return CURRENTS_TO_CURATOR_CATEGORY.get(key, "news")


def is_currents_source(source) -> bool:
    """True when a pipeline Source row represents Currents API."""
    url = (source.url or "").strip().lower()
    return url.startswith("currents://") or "currentsapi.services" in url


def fetch_currents_entries(source) -> list[dict]:
    """Fetch latest news from Currents API. Returns normalized entry dicts."""
    api_key = getattr(settings, "CURRENTS_API_KEY", "")
    if not api_key:
        raise ValueError("CURRENTS_API_KEY is not configured.")

    if currents_budget_remaining() <= 0:
        logger.warning("Currents API daily request budget exhausted.")
        return []

    config = parse_source_config(source)
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
    record_request(PROVIDER)

    payload = response.json()
    if payload.get("status") != "ok":
        raise ValueError(f"Currents API error: {payload.get('message', payload)}")

    items = []
    for article in payload.get("news") or []:
        items.append(
            normalize_entry(
                external_id=str(article.get("id", "")),
                url=article.get("url", ""),
                title=article.get("title", ""),
                summary=article.get("description", ""),
                author=article.get("author", ""),
                image_url=(article.get("image") or "none") if article.get("image") != "none" else "",
                published_at=parse_iso_datetime(article.get("published")),
            )
        )
    return items
