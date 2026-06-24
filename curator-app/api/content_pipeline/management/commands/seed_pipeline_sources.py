from django.core.management.base import BaseCommand
from django.utils.text import slugify

from content_pipeline.models import Source, SourceKind, SourceLicenseStatus
from mobileapi.models import Category

# Reputable RSS feeds with staggered fetch intervals (minutes) so hourly cron
# does not hammer every outlet at once. Intervals are persisted on each seed run.
RETIRED_SOURCE_SLUGS = ("reuters-world",)

DEFAULT_SOURCES = [
    # Global / breaking — faster cadence
    {
        "name": "BBC World",
        "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "category": "news",
        "fetch_interval_minutes": 60,
    },
    {
        "name": "NPR News",
        "url": "https://feeds.npr.org/1001/rss.xml",
        "category": "news",
        "fetch_interval_minutes": 60,
    },
    {
        "name": "AP Top News",
        "url": "https://feeds.apnews.com/rss/apf-topnews",
        "category": "news",
        "fetch_interval_minutes": 65,
    },
    {
        "name": "Guardian World",
        "url": "https://www.theguardian.com/world/rss",
        "category": "news",
        "fetch_interval_minutes": 70,
    },
    {
        "name": "Al Jazeera English",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "category": "news",
        "fetch_interval_minutes": 75,
    },
    {
        "name": "Guardian Politics",
        "url": "https://www.theguardian.com/politics/rss",
        "category": "politics",
        "fetch_interval_minutes": 75,
    },
    # Technology
    {
        "name": "BBC Technology",
        "url": "https://feeds.bbci.co.uk/news/technology/rss.xml",
        "category": "technology",
        "fetch_interval_minutes": 80,
    },
    {
        "name": "Ars Technica",
        "url": "https://feeds.arstechnica.com/arstechnica/index",
        "category": "technology",
        "fetch_interval_minutes": 85,
    },
    {
        "name": "The Verge",
        "url": "https://www.theverge.com/rss/index.xml",
        "category": "technology",
        "fetch_interval_minutes": 90,
    },
    {
        "name": "Wired",
        "url": "https://www.wired.com/feed/rss",
        "category": "technology",
        "fetch_interval_minutes": 95,
    },
    # Economy
    {
        "name": "BBC Business",
        "url": "https://feeds.bbci.co.uk/news/business/rss.xml",
        "category": "economy",
        "fetch_interval_minutes": 80,
    },
    {
        "name": "Financial Times World",
        "url": "https://www.ft.com/world?format=rss",
        "category": "economy",
        "fetch_interval_minutes": 100,
    },
    # Science & health
    {
        "name": "BBC Science",
        "url": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
        "category": "science",
        "fetch_interval_minutes": 90,
    },
    {
        "name": "Nature News",
        "url": "https://www.nature.com/nature.rss",
        "category": "science",
        "fetch_interval_minutes": 120,
    },
    {
        "name": "BBC Health",
        "url": "https://feeds.bbci.co.uk/news/health/rss.xml",
        "category": "health",
        "fetch_interval_minutes": 90,
    },
    {
        "name": "STAT News",
        "url": "https://www.statnews.com/feed/",
        "category": "health",
        "fetch_interval_minutes": 105,
    },
    # Climate & culture — slower cadence
    {
        "name": "Grist",
        "url": "https://grist.org/feed/",
        "category": "climate",
        "fetch_interval_minutes": 110,
    },
    {
        "name": "Inside Climate News",
        "url": "https://insideclimatenews.org/feed/",
        "category": "climate",
        "fetch_interval_minutes": 120,
    },
    {
        "name": "The Guardian Culture",
        "url": "https://www.theguardian.com/culture/rss",
        "category": "culture",
        "fetch_interval_minutes": 100,
    },
    {
        "name": "Aeon",
        "url": "https://aeon.co/feed.rss",
        "category": "culture",
        "fetch_interval_minutes": 120,
    },
]


class Command(BaseCommand):
    help = "Seed RSS pipeline sources (staggered intervals, retired feeds deactivated)."

    def handle(self, *args, **options):
        categories = {category.slug: category for category in Category.objects.all()}
        created = 0
        updated = 0

        for entry in DEFAULT_SOURCES:
            _, was_created = Source.objects.update_or_create(
                slug=slugify(entry["name"]),
                defaults={
                    "name": entry["name"],
                    "kind": SourceKind.RSS,
                    "url": entry["url"],
                    "category": categories.get(entry["category"]),
                    "is_active": True,
                    "license_status": SourceLicenseStatus.RSS_PERMITTED,
                    "fetch_interval_minutes": entry.get("fetch_interval_minutes", 60),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        retired = Source.objects.filter(slug__in=RETIRED_SOURCE_SLUGS).update(is_active=False)
        if retired:
            self.stdout.write(f"Retired {retired} source(s): {', '.join(RETIRED_SOURCE_SLUGS)}")

        self.stdout.write(
            self.style.SUCCESS(
                f"RSS sources seeded: {created} created, {updated} updated "
                f"({len(DEFAULT_SOURCES)} active catalog)."
            )
        )
