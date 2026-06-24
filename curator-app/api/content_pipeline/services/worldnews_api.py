"""World News API — clustered top news by country (great for cross-outlet coverage).

Docs: https://worldnewsapi.com/docs/top-news/
Free tier: 50 points/day (backlink required on free plan).
"""

from __future__ import annotations

import logging

import requests
from django.conf import settings

from content_pipeline.services.api_budget import budget_remaining, record_request
from content_pipeline.services.api_common import normalize_entry, parse_iso_datetime, parse_source_config

logger = logging.getLogger(__name__)

WORLDNEWS_TOP_URL = "https://api.worldnewsapi.com/top-news"
WORLDNEWS_SEARCH_URL = "https://api.worldnewsapi.com/search-news"
PROVIDER = "worldnews"


def is_worldnews_source(source) -> bool:
    url = (source.url or "").strip().lower()
    return url.startswith("worldnews://") or "api.worldnewsapi.com" in url


def worldnews_budget_remaining() -> int:
    limit = int(getattr(settings, "WORLDNEWS_DAILY_REQUEST_BUDGET", 50))
    return budget_remaining(PROVIDER, limit)


def fetch_worldnews_entries(source) -> list[dict]:
    api_key = getattr(settings, "WORLDNEWS_API_KEY", "")
    if not api_key:
        raise ValueError("WORLDNEWS_API_KEY is not configured.")

    if worldnews_budget_remaining() <= 0:
        logger.warning("World News API daily request budget exhausted.")
        return []

    config = parse_source_config(source)
    endpoint = (config.get("endpoint") or "top-news").strip().lower()
    base_url = WORLDNEWS_SEARCH_URL if endpoint == "search-news" else WORLDNEWS_TOP_URL

    params = {
        "api-key": api_key,
        "language": config.get("language", "en"),
    }
    if config.get("source-country"):
        params["source-country"] = config["source-country"]
    if config.get("text"):
        params["text"] = config["text"]
    if endpoint == "search-news":
        params["number"] = min(int(config.get("number", 10)), 25)

    response = requests.get(
        base_url,
        params=params,
        headers={"Accept": "application/json", "User-Agent": "CuratorBot/1.0"},
        timeout=30,
    )
    response.raise_for_status()
    record_request(PROVIDER)

    payload = response.json()
    items = []

    if endpoint == "search-news":
        for article in payload.get("news") or []:
            items.append(_normalize_worldnews_article(article))
        return items

    for cluster in payload.get("top_news") or []:
        for article in cluster.get("news") or []:
            items.append(_normalize_worldnews_article(article))
    return items


def _normalize_worldnews_article(article: dict) -> dict:
    authors = article.get("authors") or []
    author = article.get("author", "")
    if not author and authors:
        author = ", ".join(str(name) for name in authors if name)
    return normalize_entry(
        external_id=str(article.get("id", "")),
        url=article.get("url", ""),
        title=article.get("title", ""),
        summary=article.get("summary") or "",
        author=author,
        image_url=article.get("image", "") or "",
        published_at=parse_iso_datetime(article.get("publish_date")),
    )
