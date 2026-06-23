from django.core.management.base import BaseCommand
from django.utils.text import slugify

from content_pipeline.models import Source, SourceKind, SourceLicenseStatus
from mobileapi.models import Category

# Reputable, freely accessible RSS feeds mapped to Curator's category catalog.
DEFAULT_SOURCES = [
    {"name": "Reuters World", "url": "https://feeds.reuters.com/Reuters/worldNews", "category": "news"},
    {"name": "BBC World", "url": "https://feeds.bbci.co.uk/news/world/rss.xml", "category": "news"},
    {"name": "BBC Technology", "url": "https://feeds.bbci.co.uk/news/technology/rss.xml", "category": "technology"},
    {"name": "Ars Technica", "url": "https://feeds.arstechnica.com/arstechnica/index", "category": "technology"},
    {"name": "The Verge", "url": "https://www.theverge.com/rss/index.xml", "category": "technology"},
    {"name": "BBC Business", "url": "https://feeds.bbci.co.uk/news/business/rss.xml", "category": "economy"},
    {"name": "Financial Times World", "url": "https://www.ft.com/world?format=rss", "category": "economy"},
    {"name": "BBC Science", "url": "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "category": "science"},
    {"name": "Nature News", "url": "https://www.nature.com/nature.rss", "category": "science"},
    {"name": "BBC Health", "url": "https://feeds.bbci.co.uk/news/health/rss.xml", "category": "health"},
    {"name": "STAT News", "url": "https://www.statnews.com/feed/", "category": "health"},
    {"name": "Grist", "url": "https://grist.org/feed/", "category": "climate"},
    {"name": "Inside Climate News", "url": "https://insideclimatenews.org/feed/", "category": "climate"},
    {"name": "The Guardian Culture", "url": "https://www.theguardian.com/culture/rss", "category": "culture"},
    {"name": "Aeon", "url": "https://aeon.co/feed.rss", "category": "culture"},
]


class Command(BaseCommand):
    help = "Seed the content pipeline with a default set of RSS sources."

    def handle(self, *args, **options):
        categories = {category.slug: category for category in Category.objects.all()}
        created = 0
        updated = 0

        for entry in DEFAULT_SOURCES:
            source, was_created = Source.objects.update_or_create(
                slug=slugify(entry["name"]),
                defaults={
                    "name": entry["name"],
                    "kind": SourceKind.RSS,
                    "url": entry["url"],
                    "category": categories.get(entry["category"]),
                    "is_active": True,
                    "license_status": SourceLicenseStatus.RSS_PERMITTED,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Sources seeded: {created} created, {updated} updated.")
        )
