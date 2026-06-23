from django.core.management.base import BaseCommand
from django.utils.text import slugify

from content_pipeline.models import Source, SourceKind, SourceLicenseStatus
from mobileapi.models import Category

# Currents API sources for India / regional coverage.
# URL query params are parsed by content_pipeline.services.currents.
CURRENTS_BASE = "https://api.currentsapi.services/v1/latest-news"

DEFAULT_CURRENTS_SOURCES = [
    {
        "name": "Currents World Headlines",
        "url": f"{CURRENTS_BASE}?language=en&page_size=30",
        "category": "news",
    },
    {
        "name": "Currents India News",
        "url": f"{CURRENTS_BASE}?country=IN&language=en&page_size=30",
        "category": "news",
    },
    {
        "name": "Currents India Business",
        "url": f"{CURRENTS_BASE}?country=IN&language=en&category=business&page_size=30",
        "category": "economy",
    },
    {
        "name": "Currents India Technology",
        "url": f"{CURRENTS_BASE}?country=IN&language=en&category=technology&page_size=30",
        "category": "technology",
    },
    {
        "name": "Currents India Health",
        "url": f"{CURRENTS_BASE}?country=IN&language=en&category=health&page_size=30",
        "category": "health",
    },
    {
        "name": "Currents World Politics",
        "url": f"{CURRENTS_BASE}?language=en&category=politics&page_size=30",
        "category": "politics",
    },
]


class Command(BaseCommand):
    help = "Seed Currents API sources for India/regional news (requires CURRENTS_API_KEY)."

    def handle(self, *args, **options):
        categories = {category.slug: category for category in Category.objects.all()}
        created = 0
        updated = 0

        for entry in DEFAULT_CURRENTS_SOURCES:
            _, was_created = Source.objects.update_or_create(
                slug=slugify(entry["name"]),
                defaults={
                    "name": entry["name"],
                    "kind": SourceKind.API,
                    "url": entry["url"],
                    "category": categories.get(entry["category"]),
                    "is_active": True,
                    "license_status": SourceLicenseStatus.LICENSED,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Currents sources seeded: {created} created, {updated} updated."
            )
        )
