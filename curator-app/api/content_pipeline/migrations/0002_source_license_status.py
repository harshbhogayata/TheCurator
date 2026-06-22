from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content_pipeline", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="source",
            name="license_status",
            field=models.CharField(
                choices=[
                    ("licensed", "Licensed / partner feed"),
                    ("rss_permitted", "RSS explicitly permitted"),
                    ("review_required", "Needs legal review"),
                    ("blocked", "Blocked — do not ingest"),
                ],
                db_index=True,
                default="review_required",
                help_text="Only licensed or rss_permitted sources are ingested automatically.",
                max_length=32,
            ),
        ),
    ]
