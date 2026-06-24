"""GNews API — Google News ranked headlines from 80k+ sources.

Docs: https://docs.gnews.io/
Free tier: 100 requests/day, 10 articles/request, 12h delay (dev/testing per ToS).
"""

from __future__ import annotations

import logging

import requests
from django.conf import settings

from content_pipeline.services.api_budget import budget_remaining, record_request
from content_pipeline.services.api_common import normalize_entry, parse_iso_datetime, parse_source_config

logger = logging.getLogger(__name__)

GNEWS_TOP_HEADLINES_URL = "https://gnews.io/api/v4/top-headlines"
GNEWS_SEARCH_URL = "https://gnews.io/api/v4/search"
PROVIDER = "gnews"


def is_gnews_source(source) -> bool:
    url = (source.url or "").strip().lower()
    return url.startswith("gnews://") or "gnews.io/api/" in url


def gnews_budget_remaining() -> int:
    limit = int(getattr(settings, "GNEWS_DAILY_REQUEST_BUDGET", 100))
    return budget_remaining(PROVIDER, limit)


def fetch_gnews_entries(source) -> list[dict]:
    api_key = getattr(settings, "GNEWS_API_KEY", "")
    if not api_key:
        raise ValueError("GNEWS_API_KEY is not configured.")

    if gnews_budget_remaining() <= 0:
        logger.warning("GNews API daily request budget exhausted.")
        return []

    config = parse_source_config(source)
    endpoint = (config.get("endpoint") or "top-headlines").strip().lower()
    base_url = GNEWS_SEARCH_URL if endpoint == "search" else GNEWS_TOP_HEADLINES_URL

    params = {
        "apikey": api_key,
        "lang": config.get("lang", "en"),
        "max": min(int(config.get("max", 10)), 10),
        "page": 1,
    }
    if config.get("category"):
        params["category"] = config["category"]
    if config.get("country"):
        params["country"] = config["country"]
    if config.get("q"):
        params["q"] = config["q"]

    response = requests.get(
        base_url,
        params=params,
        headers={"Accept": "application/json", "User-Agent": "CuratorBot/1.0"},
        timeout=30,
    )
    response.raise_for_status()
    record_request(PROVIDER)

    payload = response.json()
    articles = payload.get("articles") or []
    if not articles and payload.get("errors"):
        raise ValueError(f"GNews API error: {payload['errors']}")

    items = []
    for article in articles:
        source_info = article.get("source") or {}
        items.append(
            normalize_entry(
                external_id=str(article.get("url", "")),
                url=article.get("url", ""),
                title=article.get("title", ""),
                summary=article.get("description", ""),
                author=source_info.get("name", ""),
                image_url=article.get("image", ""),
                published_at=parse_iso_datetime(article.get("publishedAt")),
            )
        )
    return items
