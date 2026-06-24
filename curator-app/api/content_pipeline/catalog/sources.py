"""Reputable free RSS feeds and Currents API endpoints for pipeline seeding.

RSS feeds are marked rss_permitted (public feeds). Currents rows require
CURRENTS_API_KEY and stay within CURRENTS_DAILY_REQUEST_BUDGET (default 1,000/day).
Intervals are staggered so hourly cron does not hit every outlet at once.
"""

CURRENTS_BASE = "https://api.currentsapi.services/v1/latest-news"


def _currents(**params) -> str:
    query = "&".join(f"{key}={value}" for key, value in params.items())
    return f"{CURRENTS_BASE}?{query}"


# ---------------------------------------------------------------------------
# RSS — global (existing + additional free world outlets)
# ---------------------------------------------------------------------------
RSS_GLOBAL = [
    {
        "name": "BBC World",
        "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "category": "news",
        "fetch_interval_minutes": 60,
        "region": "global",
    },
    {
        "name": "NPR News",
        "url": "https://feeds.npr.org/1001/rss.xml",
        "category": "news",
        "fetch_interval_minutes": 60,
        "region": "global",
    },
    {
        "name": "AP Top News",
        "url": "https://feeds.apnews.com/rss/apf-topnews",
        "category": "news",
        "fetch_interval_minutes": 65,
        "region": "global",
    },
    {
        "name": "Guardian World",
        "url": "https://www.theguardian.com/world/rss",
        "category": "news",
        "fetch_interval_minutes": 70,
        "region": "global",
    },
    {
        "name": "Al Jazeera English",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "category": "news",
        "fetch_interval_minutes": 75,
        "region": "global",
    },
    {
        "name": "DW World",
        "url": "https://rss.dw.com/rdf/rss-en-world",
        "category": "news",
        "fetch_interval_minutes": 75,
        "region": "global",
    },
    {
        "name": "France 24",
        "url": "https://www.france24.com/en/rss",
        "category": "news",
        "fetch_interval_minutes": 80,
        "region": "global",
    },
    {
        "name": "CBC World",
        "url": "https://www.cbc.ca/cmlink/rss-world",
        "category": "news",
        "fetch_interval_minutes": 80,
        "region": "global",
    },
    {
        "name": "Euronews",
        "url": "https://www.euronews.com/rss?format=xml",
        "category": "news",
        "fetch_interval_minutes": 85,
        "region": "global",
    },
    {
        "name": "South China Morning Post",
        "url": "https://www.scmp.com/rss/91/feed",
        "category": "news",
        "fetch_interval_minutes": 85,
        "region": "global",
    },
    {
        "name": "Japan Times",
        "url": "https://www.japantimes.co.jp/feed/",
        "category": "news",
        "fetch_interval_minutes": 90,
        "region": "global",
    },
    {
        "name": "UN News",
        "url": "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
        "category": "news",
        "fetch_interval_minutes": 100,
        "region": "global",
    },
    {
        "name": "Guardian Politics",
        "url": "https://www.theguardian.com/politics/rss",
        "category": "politics",
        "fetch_interval_minutes": 75,
        "region": "global",
    },
    {
        "name": "BBC Technology",
        "url": "https://feeds.bbci.co.uk/news/technology/rss.xml",
        "category": "technology",
        "fetch_interval_minutes": 80,
        "region": "global",
    },
    {
        "name": "Ars Technica",
        "url": "https://feeds.arstechnica.com/arstechnica/index",
        "category": "technology",
        "fetch_interval_minutes": 85,
        "region": "global",
    },
    {
        "name": "The Verge",
        "url": "https://www.theverge.com/rss/index.xml",
        "category": "technology",
        "fetch_interval_minutes": 90,
        "region": "global",
    },
    {
        "name": "Wired",
        "url": "https://www.wired.com/feed/rss",
        "category": "technology",
        "fetch_interval_minutes": 95,
        "region": "global",
    },
    {
        "name": "TechCrunch",
        "url": "https://techcrunch.com/feed/",
        "category": "technology",
        "fetch_interval_minutes": 90,
        "region": "global",
    },
    {
        "name": "BBC Business",
        "url": "https://feeds.bbci.co.uk/news/business/rss.xml",
        "category": "economy",
        "fetch_interval_minutes": 80,
        "region": "global",
    },
    {
        "name": "Financial Times World",
        "url": "https://www.ft.com/world?format=rss",
        "category": "economy",
        "fetch_interval_minutes": 100,
        "region": "global",
    },
    {
        "name": "BBC Science",
        "url": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
        "category": "science",
        "fetch_interval_minutes": 90,
        "region": "global",
    },
    {
        "name": "Nature News",
        "url": "https://www.nature.com/nature.rss",
        "category": "science",
        "fetch_interval_minutes": 120,
        "region": "global",
    },
    {
        "name": "Science Daily",
        "url": "https://www.sciencedaily.com/rss/all.xml",
        "category": "science",
        "fetch_interval_minutes": 110,
        "region": "global",
    },
    {
        "name": "BBC Health",
        "url": "https://feeds.bbci.co.uk/news/health/rss.xml",
        "category": "health",
        "fetch_interval_minutes": 90,
        "region": "global",
    },
    {
        "name": "STAT News",
        "url": "https://www.statnews.com/feed/",
        "category": "health",
        "fetch_interval_minutes": 105,
        "region": "global",
    },
    {
        "name": "Grist",
        "url": "https://grist.org/feed/",
        "category": "climate",
        "fetch_interval_minutes": 110,
        "region": "global",
    },
    {
        "name": "Inside Climate News",
        "url": "https://insideclimatenews.org/feed/",
        "category": "climate",
        "fetch_interval_minutes": 120,
        "region": "global",
    },
    {
        "name": "Mongabay",
        "url": "https://news.mongabay.com/feed/",
        "category": "climate",
        "fetch_interval_minutes": 120,
        "region": "global",
    },
    {
        "name": "The Guardian Culture",
        "url": "https://www.theguardian.com/culture/rss",
        "category": "culture",
        "fetch_interval_minutes": 100,
        "region": "global",
    },
    {
        "name": "Aeon",
        "url": "https://aeon.co/feed.rss",
        "category": "culture",
        "fetch_interval_minutes": 120,
        "region": "global",
    },
]

# ---------------------------------------------------------------------------
# RSS — United States
# ---------------------------------------------------------------------------
RSS_US = [
    {
        "name": "CNN Top Stories",
        "url": "https://rss.cnn.com/rss/cnn_topstories.rss",
        "category": "news",
        "fetch_interval_minutes": 65,
        "region": "us",
    },
    {
        "name": "NBC News",
        "url": "https://feeds.nbcnews.com/nbcnews/public/news",
        "category": "news",
        "fetch_interval_minutes": 65,
        "region": "us",
    },
    {
        "name": "CBS News",
        "url": "https://www.cbsnews.com/latest/rss/main",
        "category": "news",
        "fetch_interval_minutes": 70,
        "region": "us",
    },
    {
        "name": "ABC News",
        "url": "https://abcnews.go.com/abcnews/topstories",
        "category": "news",
        "fetch_interval_minutes": 70,
        "region": "us",
    },
    {
        "name": "PBS NewsHour",
        "url": "https://www.pbs.org/newshour/feeds/rss/headlines",
        "category": "news",
        "fetch_interval_minutes": 75,
        "region": "us",
    },
    {
        "name": "USA Today News",
        "url": "https://rss.usatoday.com/news",
        "category": "news",
        "fetch_interval_minutes": 80,
        "region": "us",
    },
    {
        "name": "LA Times Nation",
        "url": "https://www.latimes.com/world-nation/rss2.0.xml",
        "category": "news",
        "fetch_interval_minutes": 85,
        "region": "us",
    },
    {
        "name": "NPR Politics",
        "url": "https://feeds.npr.org/1014/rss.xml",
        "category": "politics",
        "fetch_interval_minutes": 75,
        "region": "us",
    },
    {
        "name": "Politico",
        "url": "https://rss.politico.com/politics-news.xml",
        "category": "politics",
        "fetch_interval_minutes": 75,
        "region": "us",
    },
    {
        "name": "The Hill",
        "url": "https://thehill.com/news/feed/",
        "category": "politics",
        "fetch_interval_minutes": 80,
        "region": "us",
    },
    {
        "name": "Axios Top",
        "url": "https://api.axios.com/feed/",
        "category": "news",
        "fetch_interval_minutes": 85,
        "region": "us",
    },
    {
        "name": "MIT Technology Review",
        "url": "https://www.technologyreview.com/feed/",
        "category": "technology",
        "fetch_interval_minutes": 95,
        "region": "us",
    },
]

# ---------------------------------------------------------------------------
# RSS — United Kingdom
# ---------------------------------------------------------------------------
RSS_UK = [
    {
        "name": "BBC UK",
        "url": "https://feeds.bbci.co.uk/news/rss.xml",
        "category": "news",
        "fetch_interval_minutes": 60,
        "region": "uk",
    },
    {
        "name": "BBC England",
        "url": "https://feeds.bbci.co.uk/news/england/rss.xml",
        "category": "news",
        "fetch_interval_minutes": 85,
        "region": "uk",
    },
    {
        "name": "BBC Scotland",
        "url": "https://feeds.bbci.co.uk/news/scotland/rss.xml",
        "category": "news",
        "fetch_interval_minutes": 90,
        "region": "uk",
    },
    {
        "name": "Guardian UK",
        "url": "https://www.theguardian.com/uk/rss",
        "category": "news",
        "fetch_interval_minutes": 65,
        "region": "uk",
    },
    {
        "name": "Independent UK",
        "url": "https://www.independent.co.uk/news/uk/rss",
        "category": "news",
        "fetch_interval_minutes": 80,
        "region": "uk",
    },
    {
        "name": "Sky News UK",
        "url": "https://feeds.skynews.com/feeds/rss/uk.xml",
        "category": "news",
        "fetch_interval_minutes": 70,
        "region": "uk",
    },
    {
        "name": "ITV News",
        "url": "https://www.itv.com/news/rss",
        "category": "news",
        "fetch_interval_minutes": 85,
        "region": "uk",
    },
]

# ---------------------------------------------------------------------------
# RSS — India
# ---------------------------------------------------------------------------
RSS_INDIA = [
    {
        "name": "The Hindu National",
        "url": "https://www.thehindu.com/news/national/feeder/default.rss",
        "category": "news",
        "fetch_interval_minutes": 65,
        "region": "india",
    },
    {
        "name": "The Hindu Business",
        "url": "https://www.thehindu.com/business/Economy/feeder/default.rss",
        "category": "economy",
        "fetch_interval_minutes": 90,
        "region": "india",
    },
    {
        "name": "Indian Express",
        "url": "https://indianexpress.com/feed/",
        "category": "news",
        "fetch_interval_minutes": 65,
        "region": "india",
    },
    {
        "name": "NDTV Top Stories",
        "url": "https://feeds.feedburner.com/ndtvnews-top-stories",
        "category": "news",
        "fetch_interval_minutes": 70,
        "region": "india",
    },
    {
        "name": "Hindustan Times India",
        "url": "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
        "category": "news",
        "fetch_interval_minutes": 75,
        "region": "india",
    },
    {
        "name": "Economic Times",
        "url": "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
        "category": "economy",
        "fetch_interval_minutes": 80,
        "region": "india",
    },
    {
        "name": "Mint",
        "url": "https://www.livemint.com/rss/news",
        "category": "economy",
        "fetch_interval_minutes": 85,
        "region": "india",
    },
    {
        "name": "The Wire",
        "url": "https://thewire.in/rss/feed",
        "category": "news",
        "fetch_interval_minutes": 90,
        "region": "india",
    },
    {
        "name": "Scroll.in",
        "url": "https://scroll.in/latest.rss",
        "category": "news",
        "fetch_interval_minutes": 90,
        "region": "india",
    },
    {
        "name": "Times of India",
        "url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "category": "news",
        "fetch_interval_minutes": 75,
        "region": "india",
    },
]

RSS_SOURCES = RSS_GLOBAL + RSS_US + RSS_UK + RSS_INDIA

RETIRED_RSS_SLUGS = ("reuters-world",)

# ---------------------------------------------------------------------------
# Currents API — global + US (US) + UK (GB) + India (IN)
# Intervals 90–150 min → ~350–450 req/day with full catalog (under 1,000 budget).
# ---------------------------------------------------------------------------
CURRENTS_SOURCES = [
    # Global
    {
        "name": "Currents World Headlines",
        "url": _currents(language="en", page_size=30),
        "category": "news",
        "fetch_interval_minutes": 90,
        "region": "global",
    },
    {
        "name": "Currents World Politics",
        "url": _currents(language="en", category="politics", page_size=30),
        "category": "politics",
        "fetch_interval_minutes": 90,
        "region": "global",
    },
    {
        "name": "Currents World Business",
        "url": _currents(language="en", category="business", page_size=30),
        "category": "economy",
        "fetch_interval_minutes": 120,
        "region": "global",
    },
    {
        "name": "Currents World Technology",
        "url": _currents(language="en", category="technology", page_size=30),
        "category": "technology",
        "fetch_interval_minutes": 120,
        "region": "global",
    },
    {
        "name": "Currents World Science",
        "url": _currents(language="en", category="science", page_size=30),
        "category": "science",
        "fetch_interval_minutes": 150,
        "region": "global",
    },
    {
        "name": "Currents World Health",
        "url": _currents(language="en", category="health", page_size=30),
        "category": "health",
        "fetch_interval_minutes": 120,
        "region": "global",
    },
    {
        "name": "Currents World Environment",
        "url": _currents(language="en", category="environment", page_size=30),
        "category": "climate",
        "fetch_interval_minutes": 150,
        "region": "global",
    },
    # United States
    {
        "name": "Currents US News",
        "url": _currents(country="US", language="en", page_size=30),
        "category": "news",
        "fetch_interval_minutes": 90,
        "region": "us",
    },
    {
        "name": "Currents US Politics",
        "url": _currents(country="US", language="en", category="politics", page_size=30),
        "category": "politics",
        "fetch_interval_minutes": 90,
        "region": "us",
    },
    {
        "name": "Currents US Business",
        "url": _currents(country="US", language="en", category="business", page_size=30),
        "category": "economy",
        "fetch_interval_minutes": 120,
        "region": "us",
    },
    {
        "name": "Currents US Technology",
        "url": _currents(country="US", language="en", category="technology", page_size=30),
        "category": "technology",
        "fetch_interval_minutes": 120,
        "region": "us",
    },
    {
        "name": "Currents US Health",
        "url": _currents(country="US", language="en", category="health", page_size=30),
        "category": "health",
        "fetch_interval_minutes": 120,
        "region": "us",
    },
    # United Kingdom (ISO 3166-1 alpha-2: GB)
    {
        "name": "Currents UK News",
        "url": _currents(country="GB", language="en", page_size=30),
        "category": "news",
        "fetch_interval_minutes": 90,
        "region": "uk",
    },
    {
        "name": "Currents UK Politics",
        "url": _currents(country="GB", language="en", category="politics", page_size=30),
        "category": "politics",
        "fetch_interval_minutes": 90,
        "region": "uk",
    },
    {
        "name": "Currents UK Business",
        "url": _currents(country="GB", language="en", category="business", page_size=30),
        "category": "economy",
        "fetch_interval_minutes": 120,
        "region": "uk",
    },
    {
        "name": "Currents UK Technology",
        "url": _currents(country="GB", language="en", category="technology", page_size=30),
        "category": "technology",
        "fetch_interval_minutes": 120,
        "region": "uk",
    },
    {
        "name": "Currents UK Health",
        "url": _currents(country="GB", language="en", category="health", page_size=30),
        "category": "health",
        "fetch_interval_minutes": 120,
        "region": "uk",
    },
    # India
    {
        "name": "Currents India News",
        "url": _currents(country="IN", language="en", page_size=30),
        "category": "news",
        "fetch_interval_minutes": 90,
        "region": "india",
    },
    {
        "name": "Currents India Politics",
        "url": _currents(country="IN", language="en", category="politics", page_size=30),
        "category": "politics",
        "fetch_interval_minutes": 90,
        "region": "india",
    },
    {
        "name": "Currents India Business",
        "url": _currents(country="IN", language="en", category="business", page_size=30),
        "category": "economy",
        "fetch_interval_minutes": 120,
        "region": "india",
    },
    {
        "name": "Currents India Technology",
        "url": _currents(country="IN", language="en", category="technology", page_size=30),
        "category": "technology",
        "fetch_interval_minutes": 120,
        "region": "india",
    },
    {
        "name": "Currents India Health",
        "url": _currents(country="IN", language="en", category="health", page_size=30),
        "category": "health",
        "fetch_interval_minutes": 120,
        "region": "india",
    },
    {
        "name": "Currents India Science",
        "url": _currents(country="IN", language="en", category="science", page_size=30),
        "category": "science",
        "fetch_interval_minutes": 150,
        "region": "india",
    },
]


def estimate_currents_requests_per_day(sources=None) -> int:
    """Rough daily API call estimate from fetch intervals (24h / interval)."""
    catalog = sources or CURRENTS_SOURCES
    total = 0.0
    for entry in catalog:
        minutes = entry.get("fetch_interval_minutes", 90)
        total += (24 * 60) / max(minutes, 1)
    return int(total)
