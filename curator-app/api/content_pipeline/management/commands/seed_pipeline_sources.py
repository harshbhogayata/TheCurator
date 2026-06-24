from collections import Counter

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from content_pipeline.catalog.sources import RETIRED_RSS_SLUGS, RSS_SOURCES
from content_pipeline.models import Source, SourceKind, SourceLicenseStatus
from mobileapi.models import Category


class Command(BaseCommand):
    help = "Seed RSS pipeline sources (global, US, UK, India; staggered intervals)."

    def handle(self, *args, **options):
        categories = {category.slug: category for category in Category.objects.all()}
        created = 0
        updated = 0
        by_region = Counter()

        for entry in RSS_SOURCES:
            by_region[entry.get("region", "global")] += 1
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

        retired = Source.objects.filter(slug__in=RETIRED_RSS_SLUGS).update(is_active=False)
        if retired:
            self.stdout.write(f"Retired {retired} source(s): {', '.join(RETIRED_RSS_SLUGS)}")

        region_summary = ", ".join(f"{region}={count}" for region, count in sorted(by_region.items()))
        self.stdout.write(
            self.style.SUCCESS(
                f"RSS sources seeded: {created} created, {updated} updated "
                f"({len(RSS_SOURCES)} catalog; {region_summary})."
            )
        )
