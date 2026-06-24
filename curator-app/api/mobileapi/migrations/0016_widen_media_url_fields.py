from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("mobileapi", "0015_add_news_category"),
    ]

    operations = [
        migrations.AlterField(
            model_name="article",
            name="image_url",
            field=models.URLField(blank=True, max_length=1000),
        ),
        migrations.AlterField(
            model_name="article",
            name="image_source_url",
            field=models.URLField(blank=True, max_length=1000),
        ),
        migrations.AlterField(
            model_name="article",
            name="audio_url",
            field=models.URLField(blank=True, max_length=1000),
        ),
        migrations.AlterField(
            model_name="brief",
            name="image_url",
            field=models.URLField(blank=True, max_length=1000),
        ),
        migrations.AlterField(
            model_name="brief",
            name="audio_url",
            field=models.URLField(blank=True, max_length=1000),
        ),
    ]
