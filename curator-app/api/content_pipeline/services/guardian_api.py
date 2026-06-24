"""The Guardian Open Platform Content API.

Docs: https://open-platform.theguardian.com/documentation/
Free tier: 5,000 requests/day (developer key).
"""

from __future__ import annotations

import logging

import requests
from django.conf import settings

from content_pipeline.services.api_budget import budget_remaining, record_request
from content_pipeline.services.api_common import normalize_entry, parse_iso_datetime, parse_source_config

logger = logging.getLogger(__name__)

GUARDIAN_BASE_URL = "https://content.guardianapis.com/search"
PROVIDER = "guardian"


def is_guardian_source(source) -> bool:
    url = (source.url or "").strip().lower()
    return url.startswith("guardian://") or "content.guardianapis.com" in url


def guardian_budget_remaining() -> int:
    limit = int(getattr(settings, "GUARDIAN_API_DAILY_REQUEST_BUDGET", 5000))
    return budget_remaining(PROVIDER, limit)


def fetch_guardian_entries(source) -> list[dict]:
    api_key = getattr(settings, "GUARDIAN_API_KEY", "")
    if not api_key:
        raise ValueError("GUARDIAN_API_KEY is not configured.")

    if guardian_budget_remaining() <= 0:
        logger.warning("Guardian API daily request budget exhausted.")
        return []

    config = parse_source_config(source)
    params = {
        "api-key": api_key,
        "format": "json",
        "order-by": config.get("order-by", "newest"),
        "page-size": min(int(config.get("page-size", 20)), 50),
        "page": 1,
        "show-fields": "headline,trailText,thumbnail,byline",
    }
    if config.get("section"):
        params["section"] = config["section"]
    if config.get("q"):
        params["q"] = config["q"]

    response = requests.get(
        GUARDIAN_BASE_URL,
        params=params,
        headers={"Accept": "application/json", "User-Agent": "CuratorBot/1.0"},
        timeout=30,
    )
    response.raise_for_status()
    record_request(PROVIDER)

    payload = response.json()
    if payload.get("response", {}).get("status") != "ok":
        raise ValueError(f"Guardian API error: {payload}")

    items = []
    for article in payload.get("response", {}).get("results") or []:
        fields = article.get("fields") or {}
        items.append(
            normalize_entry(
                external_id=str(article.get("id", "")),
                url=article.get("webUrl", ""),
                title=fields.get("headline") or article.get("webTitle", ""),
                summary=fields.get("trailText", ""),
                author=fields.get("byline", ""),
                image_url=fields.get("thumbnail", ""),
                published_at=parse_iso_datetime(article.get("webPublicationDate")),
            )
        )
    return items
