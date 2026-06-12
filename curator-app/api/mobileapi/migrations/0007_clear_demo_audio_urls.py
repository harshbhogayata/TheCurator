from django.db import migrations


DEMO_AUDIO_MARKERS = (
    "soundhelix.com/examples/mp3/",
    "cs.uic.edu/~i101/SoundFiles/",
)


def clear_demo_audio_urls(apps, schema_editor):
    Article = apps.get_model("mobileapi", "Article")
    Brief = apps.get_model("mobileapi", "Brief")

    for marker in DEMO_AUDIO_MARKERS:
        Article.objects.filter(audio_url__icontains=marker).update(audio_url="")
        Brief.objects.filter(audio_url__icontains=marker).update(audio_url="")


class Migration(migrations.Migration):
    dependencies = [
        ("mobileapi", "0006_alter_article_is_active_alter_article_published_at_and_more"),
    ]

    operations = [
        migrations.RunPython(clear_demo_audio_urls, migrations.RunPython.noop),
    ]
