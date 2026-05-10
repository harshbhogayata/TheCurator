import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

from celery.schedules import crontab

app.conf.beat_schedule = {
    'send-daily-push-notifications': {
        'task': 'mobileapi.tasks.send_daily_push_notifications',
        'schedule': crontab(hour=8, minute=0),  # 8:00 AM daily
    },
    'send-email-digests': {
        'task': 'mobileapi.tasks.send_email_digests',
        'schedule': crontab(hour=7, minute=0),  # 7:00 AM daily
    },
}
