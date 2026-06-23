from django.db import migrations


def seed_news_category(apps, schema_editor):
    Category = apps.get_model("mobileapi", "Category")

    Category.objects.update_or_create(
        slug="news",
        defaults={
            "name": "World News",
            "color": "#0369a1",
            "icon": "newspaper",
            "rank": 0,
            "is_active": True,
        },
    )

    # Keep explore tab ordering stable after inserting news at rank 0.
    rank_updates = [
        ("economy", 1),
        ("technology", 2),
        ("climate", 3),
        ("culture", 4),
        ("health", 5),
        ("politics", 6),
        ("science", 7),
    ]
    for slug, rank in rank_updates:
        Category.objects.filter(slug=slug).update(rank=rank)


class Migration(migrations.Migration):
    dependencies = [
        ("mobileapi", "0014_brief_audio_duration_sec"),
    ]

    operations = [
        migrations.RunPython(seed_news_category, migrations.RunPython.noop),
    ]
