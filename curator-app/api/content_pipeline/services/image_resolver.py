"""Resolve hero images from royalty-free stock APIs.

Order: Pexels → Unsplash (optional). RSS media is handled upstream in fetchers.
"""

from __future__ import annotations

import logging
from typing import TypedDict

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"
UNSPLASH_SEARCH_URL = "https://api.unsplash.com/search/photos"


class ResolvedImage(TypedDict):
    image_url: str
    image_source_url: str
    image_attribution: str


def _resolve_pexels(query: str) -> ResolvedImage | None:
    api_key = getattr(settings, "PEXELS_API_KEY", "")
    if not api_key:
        return None

    try:
        response = requests.get(
            PEXELS_SEARCH_URL,
            params={"query": query, "per_page": 1, "orientation": "landscape"},
            headers={"Authorization": api_key},
            timeout=15,
        )
    except requests.RequestException as exc:
        logger.warning("Pexels request failed: %s", exc)
        return None

    if response.status_code != 200:
        logger.warning("Pexels search failed (%s): %s", response.status_code, response.text[:200])
        return None

    photos = response.json().get("photos") or []
    if not photos:
        return None

    photo = photos[0]
    src = photo.get("src") or {}
    image_url = src.get("large") or src.get("large2x") or src.get("medium")
    if not image_url:
        return None

    photographer = (photo.get("photographer") or "Pexels Contributor").strip()
    photo_url = (photo.get("url") or "https://www.pexels.com").strip()
    return ResolvedImage(
        image_url=image_url,
        image_source_url=photo_url,
        image_attribution=f"Photo by {photographer} on Pexels",
    )


def _resolve_unsplash(query: str) -> ResolvedImage | None:
    access_key = getattr(settings, "UNSPLASH_ACCESS_KEY", "")
    if not access_key:
        return None

    try:
        response = requests.get(
            UNSPLASH_SEARCH_URL,
            params={"query": query, "per_page": 1, "orientation": "landscape"},
            headers={"Authorization": f"Client-ID {access_key}", "Accept-Version": "v1"},
            timeout=15,
        )
    except requests.RequestException as exc:
        logger.warning("Unsplash request failed: %s", exc)
        return None

    if response.status_code != 200:
        logger.warning("Unsplash search failed (%s): %s", response.status_code, response.text[:200])
        return None

    results = response.json().get("results") or []
    if not results:
        return None

    photo = results[0]
    urls = photo.get("urls") or {}
    image_url = urls.get("regular") or urls.get("full") or urls.get("small")
    if not image_url:
        return None

    user = photo.get("user") or {}
    name = (user.get("name") or "Unsplash Contributor").strip()
    profile = (user.get("links", {}) or {}).get("html") or "https://unsplash.com"
    photo_page = (photo.get("links", {}) or {}).get("html") or profile
    return ResolvedImage(
        image_url=image_url,
        image_source_url=photo_page,
        image_attribution=f"Photo by {name} on Unsplash",
    )


def resolve_stock_image(image_query: str) -> ResolvedImage | None:
    """Return a landscape hero image for *image_query*, or None if unavailable."""
    query = (image_query or "").strip()
    if not query:
        return None

    return _resolve_pexels(query) or _resolve_unsplash(query)


def effective_image_query(*, title: str = "", image_query: str = "", category: str = "") -> str:
    """Best stock-photo search phrase from LLM query, category, or title."""
    query = (image_query or "").strip()
    if query:
        return query
    category_name = (category or "").strip()
    if category_name:
        return f"{category_name} news"
    words = (title or "").split()[:5]
    return " ".join(words) if words else "world news"


def resolve_content_hero_image(
    *,
    title: str = "",
    image_query: str = "",
    category: str = "",
) -> ResolvedImage | None:
    """Resolve a hero image using query fallbacks (Pexels → Unsplash)."""
    return resolve_stock_image(
        effective_image_query(title=title, image_query=image_query, category=category)
    )
