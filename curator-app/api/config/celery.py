import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Respect Django's TIME_ZONE setting (Asia/Kolkata) for beat schedules.
# Without this, crontab() expressions run in UTC, shifting scheduled times.
from django.conf import settings as django_settings
app.conf.timezone = getattr(django_settings, "TIME_ZONE", "UTC")
app.conf.enable_utc = False

from celery.schedules import crontab

app.conf.beat_schedule = {
    'send-daily-push-notifications': {
        'task': 'mobileapi.tasks.send_daily_push_notifications',
        'schedule': crontab(hour=8, minute=0),  # 8:00 AM IST daily
    },
    'send-email-digests': {
        'task': 'mobileapi.tasks.send_email_digests',
        'schedule': crontab(hour=7, minute=0),  # 7:00 AM IST daily
        'kwargs': {'frequency': 'daily'},
    },
    'send-weekly-push-notifications': {
        'task': 'mobileapi.tasks.send_weekly_push_notifications',
        'schedule': crontab(hour=8, minute=30, day_of_week=1),  # Mondays 8:30 AM IST
    },
    'send-weekly-email-digests': {
        'task': 'mobileapi.tasks.send_email_digests',
        'schedule': crontab(hour=7, minute=30, day_of_week=1),  # Mondays 7:30 AM IST
        'kwargs': {'frequency': 'weekly'},
    },
    'pipeline-run': {
        'task': 'content_pipeline.tasks.run_pipeline',
        'schedule': crontab(minute=5),  # hourly at :05
    },
    'pipeline-publish-ready-drafts': {
        'task': 'content_pipeline.tasks.publish_ready_drafts',
        'schedule': crontab(minute='*/10'),  # pick up scheduled/approved drafts
    },
    'pipeline-daily-brief': {
        'task': 'content_pipeline.tasks.generate_daily_brief_draft',
        'schedule': crontab(hour=5, minute=30),  # 5:30 AM IST, before digests
    },
}
