"""APITube News API — global sources with NLP enrichment.

Docs: https://docs.apitube.io/
Free tier: 200 requests/day (10 results/request, 12h delay on free plan).
"""

from __future__ import annotations

import logging

import requests
from django.conf import settings

from content_pipeline.services.api_budget import budget_remaining, record_request
from content_pipeline.services.api_common import normalize_entry, parse_iso_datetime, parse_source_config

logger = logging.getLogger(__name__)

APITUBE_BASE_URL = "https://api.apitube.io/v1/news/everything"
PROVIDER = "apitube"


def is_apitube_source(source) -> bool:
    url = (source.url or "").strip().lower()
    return url.startswith("apitube://") or "api.apitube.io" in url


def apitube_budget_remaining() -> int:
    limit = int(getattr(settings, "APITUBE_DAILY_REQUEST_BUDGET", 200))
    return budget_remaining(PROVIDER, limit)


def fetch_apitube_entries(source) -> list[dict]:
    api_key = getattr(settings, "APITUBE_API_KEY", "")
    if not api_key:
        raise ValueError("APITUBE_API_KEY is not configured.")

    if apitube_budget_remaining() <= 0:
        logger.warning("APITube API daily request budget exhausted.")
        return []

    config = parse_source_config(source)
    params = {
        "per_page": min(int(config.get("per_page", 10)), 10),
        "page": 1,
    }
    for key in (
        "language.code",
        "category.id",
        "source.location.country_code",
        "title",
        "topic.id",
    ):
        if config.get(key):
            params[key] = config[key]

    response = requests.get(
        APITUBE_BASE_URL,
        params=params,
        headers={
            "Accept": "application/json",
            "User-Agent": "CuratorBot/1.0",
            "X-API-Key": api_key,
        },
        timeout=30,
    )
    response.raise_for_status()
    record_request(PROVIDER)

    payload = response.json()
    if payload.get("status") != "ok":
        raise ValueError(f"APITube API error: {payload}")

    items = []
    for article in payload.get("results") or []:
        author_info = article.get("author") or {}
        author = author_info.get("name", "") if isinstance(author_info, dict) else str(author_info)
        items.append(
            normalize_entry(
                external_id=str(article.get("id", "")),
                url=article.get("href", ""),
                title=article.get("title", ""),
                summary=article.get("description", ""),
                author=author,
                image_url=article.get("image", ""),
                published_at=parse_iso_datetime(article.get("published_at")),
            )
        )
    return items
