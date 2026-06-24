from collections import Counter

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from content_pipeline.catalog.api_sources import (
    ALL_NEWS_API_SOURCES,
    RETIRED_API_SOURCE_SLUGS,
    estimate_api_requests_per_day,
)
from content_pipeline.models import Source, SourceKind, SourceLicenseStatus
from mobileapi.models import Category


class Command(BaseCommand):
    help = "Seed licensed news API sources (Currents, Guardian, GNews, APITube, Mediastack, World News)."

    def handle(self, *args, **options):
        categories = {category.slug: category for category in Category.objects.all()}
        created = 0
        updated = 0
        by_region = Counter()

        for entry in ALL_NEWS_API_SOURCES:
            by_region[entry.get("region", "global")] += 1
            _, was_created = Source.objects.update_or_create(
                slug=slugify(entry["name"]),
                defaults={
                    "name": entry["name"],
                    "kind": SourceKind.API,
                    "url": entry["url"],
                    "category": categories.get(entry["category"]),
                    "is_active": True,
                    "license_status": SourceLicenseStatus.LICENSED,
                    "fetch_interval_minutes": entry.get("fetch_interval_minutes", 90),
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        retired = Source.objects.filter(slug__in=RETIRED_API_SOURCE_SLUGS).update(is_active=False)
        if retired:
            self.stdout.write(
                f"Deactivated {retired} retired API source(s) "
                f"(GNews, Mediastack, World News)."
            )

        estimates = estimate_api_requests_per_day()
        est_summary = ", ".join(f"{name}~{count}/day" for name, count in estimates.items())
        region_summary = ", ".join(f"{region}={count}" for region, count in sorted(by_region.items()))
        self.stdout.write(
            self.style.SUCCESS(
                f"News API sources seeded: {created} created, {updated} updated "
                f"({len(ALL_NEWS_API_SOURCES)} catalog; {region_summary}; est. {est_summary})."
            )
        )
