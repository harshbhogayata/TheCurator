from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("mobileapi", "0013_razorpay_billing"),
    ]

    operations = [
        migrations.AddField(
            model_name="brief",
            name="audio_duration_sec",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
