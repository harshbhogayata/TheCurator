"""Mediastack live news API.

Docs: https://mediastack.com/documentation
Free tier: 500 requests/month, 30-minute data delay.
"""

from __future__ import annotations

import logging

import requests
from django.conf import settings

from content_pipeline.services.api_budget import budget_remaining, record_request
from content_pipeline.services.api_common import normalize_entry, parse_iso_datetime, parse_source_config

logger = logging.getLogger(__name__)

MEDIASTACK_BASE_URL = "http://api.mediastack.com/v1/news"
PROVIDER = "mediastack"


def is_mediastack_source(source) -> bool:
    url = (source.url or "").strip().lower()
    return url.startswith("mediastack://") or "api.mediastack.com" in url


def mediastack_budget_remaining() -> int:
    limit = int(getattr(settings, "MEDIASTACK_MONTHLY_REQUEST_BUDGET", 500))
    return budget_remaining(PROVIDER, limit, period="month")


def fetch_mediastack_entries(source) -> list[dict]:
    api_key = getattr(settings, "MEDIASTACK_API_KEY", "")
    if not api_key:
        raise ValueError("MEDIASTACK_API_KEY is not configured.")

    if mediastack_budget_remaining() <= 0:
        logger.warning("Mediastack API monthly request budget exhausted.")
        return []

    config = parse_source_config(source)
    params = {
        "access_key": api_key,
        "limit": min(int(config.get("limit", 15)), 25),
        "offset": 0,
        "sort": "published_desc",
    }
    if config.get("countries"):
        params["countries"] = config["countries"]
    if config.get("languages"):
        params["languages"] = config["languages"]
    if config.get("categories"):
        params["categories"] = config["categories"]
    if config.get("keywords"):
        params["keywords"] = config["keywords"]

    response = requests.get(
        MEDIASTACK_BASE_URL,
        params=params,
        headers={"Accept": "application/json", "User-Agent": "CuratorBot/1.0"},
        timeout=30,
    )
    response.raise_for_status()
    record_request(PROVIDER, period="month")

    payload = response.json()
    if payload.get("error"):
        raise ValueError(f"Mediastack API error: {payload['error']}")

    items = []
    for article in payload.get("data") or []:
        entry = normalize_entry(
            external_id=str(article.get("url", "")),
            url=article.get("url"),
            title=article.get("title"),
            summary=article.get("description"),
            author=article.get("author"),
            image_url=article.get("image"),
            published_at=parse_iso_datetime(article.get("published_at")),
        )
        if entry["title"]:
            items.append(entry)
    return items
