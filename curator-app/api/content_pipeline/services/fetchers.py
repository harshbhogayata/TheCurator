"""Fetch stories from upstream sources into RawItem rows.

Supported source kinds:
- ``rss``: any RSS/Atom feed (parsed with feedparser).
- ``api``: licensed news APIs (Currents, Guardian, GNews, APITube, Mediastack, World News).
"""

import hashlib
import logging
from datetime import datetime, timezone as dt_timezone
from urllib.parse import urlparse, urlunparse

import requests
from django.utils import timezone

from content_pipeline.models import RawItem, Source, SourceKind, SourceLicenseStatus
from content_pipeline.services.api_registry import fetch_news_api_entries, is_news_api_source

logger = logging.getLogger(__name__)

FETCH_TIMEOUT = 30
USER_AGENT = "CuratorBot/1.0 (+https://thecuratorgroup.org)"


def normalize_url(url):
    """Canonicalize a story URL for deduplication (drop query/fragment)."""
    try:
        parsed = urlparse(url.strip())
    except (ValueError, AttributeError):
        return (url or "").strip().lower()
    return urlunparse((
        parsed.scheme.lower() or "https",
        parsed.netloc.lower(),
        parsed.path.rstrip("/"),
        "",
        "",
        "",
    ))


def compute_dedup_hash(url, title):
    basis = normalize_url(url) if url else (title or "").strip().lower()
    return hashlib.sha256(basis.encode("utf-8")).hexdigest()


def _parse_rss(source):
    import feedparser

    response = requests.get(
        source.url,
        timeout=FETCH_TIMEOUT,
        headers={"User-Agent": USER_AGENT},
    )
    response.raise_for_status()
    feed = feedparser.parse(response.content)

    items = []
    for entry in feed.entries:
        published = None
        parsed_time = entry.get("published_parsed") or entry.get("updated_parsed")
        if parsed_time:
            published = datetime(*parsed_time[:6], tzinfo=dt_timezone.utc)

        image_url = ""
        for media in entry.get("media_content", []) or []:
            if media.get("url"):
                image_url = media["url"]
                break
        if not image_url:
            for enclosure in entry.get("enclosures", []) or []:
                if str(enclosure.get("type", "")).startswith("image/") and enclosure.get("href"):
                    image_url = enclosure["href"]
                    break

        items.append({
            "external_id": entry.get("id", ""),
            "url": entry.get("link", ""),
            "title": (entry.get("title") or "").strip(),
            "summary": (entry.get("summary") or "").strip(),
            "author": (entry.get("author") or "").strip(),
            "image_url": image_url,
            "published_at": published,
        })
    return items


def _parse_json_feed(source):
    response = requests.get(
        source.url,
        timeout=FETCH_TIMEOUT,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    response.raise_for_status()
    document = response.json()

    items = []
    for entry in document.get("items", []):
        published = None
        raw_date = entry.get("date_published") or entry.get("date_modified")
        if raw_date:
            try:
                published = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
            except ValueError:
                published = None

        authors = entry.get("authors") or ([entry["author"]] if entry.get("author") else [])
        author = ", ".join(a.get("name", "") for a in authors if isinstance(a, dict) and a.get("name"))

        items.append({
            "external_id": str(entry.get("id", "")),
            "url": entry.get("url", ""),
            "title": (entry.get("title") or "").strip(),
            "summary": (entry.get("summary") or entry.get("content_text") or "").strip(),
            "author": author,
            "image_url": entry.get("image", "") or entry.get("banner_image", ""),
            "published_at": published,
        })
    return items


def fetch_source(source: Source):
    """Fetch a source and persist new RawItems. Returns count of new items."""
    if source.kind == SourceKind.RSS:
        entries = _parse_rss(source)
    elif is_news_api_source(source):
        entries = fetch_news_api_entries(source)
    else:
        entries = _parse_json_feed(source)

    created = 0
    for entry in entries:
        if not entry["title"]:
            continue
        dedup_hash = compute_dedup_hash(entry["url"], entry["title"])
        if RawItem.objects.filter(dedup_hash=dedup_hash).exists():
            continue
        RawItem.objects.create(
            source=source,
            external_id=entry["external_id"][:500],
            url=entry["url"][:1000],
            title=entry["title"][:500],
            summary=entry["summary"][:8000],
            author=entry["author"][:240],
            image_url=(entry["image_url"] or "")[:1000],
            published_at=entry["published_at"],
            dedup_hash=dedup_hash,
        )
        created += 1
    return created


def fetch_source_safely(source: Source):
    """Fetch with failure bookkeeping on the Source row."""
    if source.license_status not in {
        SourceLicenseStatus.LICENSED,
        SourceLicenseStatus.RSS_PERMITTED,
    }:
        logger.info(
            "Skipping fetch for %s — license_status=%s",
            source.slug,
            source.license_status,
        )
        return 0

    try:
        created = fetch_source(source)
    except Exception as exc:  # noqa: BLE001 - record any upstream failure
        logger.warning("Pipeline fetch failed for %s: %s", source.slug, exc)
        source.last_error = str(exc)[:1000]
        source.consecutive_failures += 1
        source.last_fetched_at = timezone.now()
        source.save(update_fields=["last_error", "consecutive_failures", "last_fetched_at", "updated_at"])
        return 0

    source.last_error = ""
    source.consecutive_failures = 0
    source.last_fetched_at = timezone.now()
    source.save(update_fields=["last_error", "consecutive_failures", "last_fetched_at", "updated_at"])
    logger.info("Pipeline fetched %s: %d new item(s)", source.slug, created)
    return created
