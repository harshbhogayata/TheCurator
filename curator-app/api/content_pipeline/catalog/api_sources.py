"""Licensed news API source catalogs (require API keys on Railway)."""

from content_pipeline.catalog.sources import CURRENTS_SOURCES


def _guardian(**params) -> str:
    query = "&".join(f"{key}={value}" for key, value in params.items())
    return f"guardian://search?{query}"


def _gnews(**params) -> str:
    query = "&".join(f"{key}={value}" for key, value in params.items())
    return f"gnews://top-headlines?{query}"


def _apitube(**params) -> str:
    query = "&".join(f"{key}={value}" for key, value in params.items())
    return f"apitube://everything?{query}"


def _mediastack(**params) -> str:
    query = "&".join(f"{key}={value}" for key, value in params.items())
    return f"mediastack://news?{query}"


def _worldnews(**params) -> str:
    query = "&".join(f"{key}={value}" for key, value in params.items())
    return f"worldnews://top-news?{query}"


GUARDIAN_SOURCES = [
    {"name": "Guardian World", "url": _guardian(section="world", **{"page-size": 20}), "category": "news", "fetch_interval_minutes": 90, "region": "global"},
    {"name": "Guardian UK News", "url": _guardian(section="uk-news", **{"page-size": 20}), "category": "news", "fetch_interval_minutes": 90, "region": "uk"},
    {"name": "Guardian US News", "url": _guardian(section="us-news", **{"page-size": 20}), "category": "news", "fetch_interval_minutes": 90, "region": "us"},
    {"name": "Guardian Politics", "url": _guardian(section="politics", **{"page-size": 20}), "category": "politics", "fetch_interval_minutes": 100, "region": "global"},
    {"name": "Guardian Technology", "url": _guardian(section="technology", **{"page-size": 20}), "category": "technology", "fetch_interval_minutes": 120, "region": "global"},
    {"name": "Guardian Business", "url": _guardian(section="business", **{"page-size": 20}), "category": "economy", "fetch_interval_minutes": 120, "region": "global"},
    {"name": "Guardian Science", "url": _guardian(section="science", **{"page-size": 20}), "category": "science", "fetch_interval_minutes": 150, "region": "global"},
    {"name": "Guardian Environment", "url": _guardian(section="environment", **{"page-size": 20}), "category": "climate", "fetch_interval_minutes": 150, "region": "global"},
]

GNEWS_SOURCES = [
    {"name": "GNews World", "url": _gnews(category="world", lang="en", max=10), "category": "news", "fetch_interval_minutes": 180, "region": "global"},
    {"name": "GNews US", "url": _gnews(category="nation", country="us", lang="en", max=10), "category": "news", "fetch_interval_minutes": 180, "region": "us"},
    {"name": "GNews UK", "url": _gnews(category="nation", country="gb", lang="en", max=10), "category": "news", "fetch_interval_minutes": 180, "region": "uk"},
    {"name": "GNews India", "url": _gnews(category="nation", country="in", lang="en", max=10), "category": "news", "fetch_interval_minutes": 180, "region": "india"},
    {"name": "GNews Business", "url": _gnews(category="business", lang="en", max=10), "category": "economy", "fetch_interval_minutes": 240, "region": "global"},
    {"name": "GNews Technology", "url": _gnews(category="technology", lang="en", max=10), "category": "technology", "fetch_interval_minutes": 240, "region": "global"},
    {"name": "GNews Science", "url": _gnews(category="science", lang="en", max=10), "category": "science", "fetch_interval_minutes": 240, "region": "global"},
    {"name": "GNews Health", "url": _gnews(category="health", lang="en", max=10), "category": "health", "fetch_interval_minutes": 240, "region": "global"},
]

APITUBE_SOURCES = [
    {"name": "APITube Global", "url": _apitube(**{"language.code": "en", "per_page": 10}), "category": "news", "fetch_interval_minutes": 120, "region": "global"},
    {"name": "APITube US", "url": _apitube(**{"language.code": "en", "source.location.country_code": "US", "per_page": 10}), "category": "news", "fetch_interval_minutes": 120, "region": "us"},
    {"name": "APITube UK", "url": _apitube(**{"language.code": "en", "source.location.country_code": "GB", "per_page": 10}), "category": "news", "fetch_interval_minutes": 120, "region": "uk"},
    {"name": "APITube India", "url": _apitube(**{"language.code": "en", "source.location.country_code": "IN", "per_page": 10}), "category": "news", "fetch_interval_minutes": 120, "region": "india"},
    {"name": "APITube Technology", "url": _apitube(**{"language.code": "en", "category.id": "technology", "per_page": 10}), "category": "technology", "fetch_interval_minutes": 150, "region": "global"},
    {"name": "APITube Business", "url": _apitube(**{"language.code": "en", "category.id": "business", "per_page": 10}), "category": "economy", "fetch_interval_minutes": 150, "region": "global"},
    {"name": "APITube Health", "url": _apitube(**{"language.code": "en", "category.id": "health", "per_page": 10}), "category": "health", "fetch_interval_minutes": 150, "region": "global"},
]

MEDIASTACK_SOURCES = [
    {"name": "Mediastack US UK IN", "url": _mediastack(countries="us,gb,in", languages="en", limit=15), "category": "news", "fetch_interval_minutes": 180, "region": "global"},
    {"name": "Mediastack US", "url": _mediastack(countries="us", languages="en", limit=15), "category": "news", "fetch_interval_minutes": 240, "region": "us"},
    {"name": "Mediastack UK", "url": _mediastack(countries="gb", languages="en", limit=15), "category": "news", "fetch_interval_minutes": 240, "region": "uk"},
    {"name": "Mediastack India", "url": _mediastack(countries="in", languages="en", limit=15), "category": "news", "fetch_interval_minutes": 240, "region": "india"},
    {"name": "Mediastack Technology", "url": _mediastack(countries="us,gb,in", languages="en", categories="technology", limit=15), "category": "technology", "fetch_interval_minutes": 360, "region": "global"},
]

WORLDNEWS_SOURCES = [
    {"name": "World News US Top", "url": _worldnews(**{"source-country": "us", "language": "en"}), "category": "news", "fetch_interval_minutes": 180, "region": "us"},
    {"name": "World News UK Top", "url": _worldnews(**{"source-country": "gb", "language": "en"}), "category": "news", "fetch_interval_minutes": 180, "region": "uk"},
    {"name": "World News India Top", "url": _worldnews(**{"source-country": "in", "language": "en"}), "category": "news", "fetch_interval_minutes": 180, "region": "india"},
    {"name": "World News Canada Top", "url": _worldnews(**{"source-country": "ca", "language": "en"}), "category": "news", "fetch_interval_minutes": 240, "region": "global"},
]

# Production catalog — GNews/Mediastack/World News kept in repo but not seeded active
# (free-tier ToS / backlink / rate limits). Re-enable by adding to ALL_NEWS_API_SOURCES.
ALL_NEWS_API_SOURCES = CURRENTS_SOURCES + GUARDIAN_SOURCES + APITUBE_SOURCES

RETIRED_API_SOURCE_SLUGS = (
    "gnews-world",
    "gnews-us",
    "gnews-uk",
    "gnews-india",
    "gnews-business",
    "gnews-technology",
    "gnews-science",
    "gnews-health",
    "mediastack-us-uk-in",
    "mediastack-us",
    "mediastack-uk",
    "mediastack-india",
    "mediastack-technology",
    "world-news-us-top",
    "world-news-uk-top",
    "world-news-india-top",
    "world-news-canada-top",
)


def estimate_api_requests_per_day(sources=None) -> dict[str, int]:
    """Rough daily call estimates per provider from fetch intervals."""
    from collections import defaultdict

    provider_prefixes = {
        "Currents": "currents",
        "Guardian": "guardian",
        "GNews": "gnews",
        "APITube": "apitube",
        "Mediastack": "mediastack",
        "World": "worldnews",
    }
    totals: dict[str, float] = defaultdict(float)
    catalog = sources or ALL_NEWS_API_SOURCES
    for entry in catalog:
        prefix = entry["name"].split()[0]
        provider = provider_prefixes.get(prefix, prefix.lower())
        minutes = entry.get("fetch_interval_minutes", 90)
        totals[provider] += (24 * 60) / max(minutes, 1)
    return {key: int(value) for key, value in sorted(totals.items())}
