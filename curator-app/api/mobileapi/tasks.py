import logging
import requests
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

from mobileapi.export_services import generate_data_export
from mobileapi.models import UserDevice, Article, Brief
from onboarding.models import UserPreference
from users.models import User

logger = logging.getLogger(__name__)


@shared_task
def generate_data_export_task(export_request_id):
    """
    Celery task to generate a privacy data export asynchronously.
    """
    try:
        generate_data_export(export_request_id)
    except Exception as exc:
        logger.exception("Task generate_data_export_task failed for request %s: %s", export_request_id, exc)
        raise

@shared_task
def send_daily_push_notifications():
    """
    Sends a daily briefing push notification to all users who have push_enabled=True.
    """
    try:
        # Find all distinct push tokens for users who have opted in
        # We assume push_enabled is a field on UserPreference
        prefs = UserPreference.objects.filter(push_enabled=True).select_related('user')
        user_ids = [p.user_id for p in prefs]
        
        devices = UserDevice.objects.filter(
            user_id__in=user_ids,
            is_active=True,
        ).exclude(expo_push_token="")
        
        # Get today's top article to feature in the push
        top_article = Article.objects.filter(is_active=True).order_by('-published_at', '-rank').first()
        
        if not top_article:
            logger.info("No articles available for daily push.")
            return

        messages = []
        for device in devices:
            messages.append({
                "to": device.expo_push_token,
                "sound": "default",
                "title": "Your Daily Curated Briefing",
                "body": f"Read today's top story: {top_article.title}",
                "data": { "url": f"/(app)/article/{top_article.id}" }
            })

        if not messages:
            return

        # Expo Push API limit is 100 per request
        chunk_size = 100
        for i in range(0, len(messages), chunk_size):
            chunk = messages[i:i + chunk_size]
            response = requests.post(
                "https://exp.host/--/api/v2/push/send",
                json=chunk,
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                }
            )
            response.raise_for_status()

            try:
                data = response.json().get("data", [])
            except ValueError:
                logger.warning("Expo push response was not JSON.")
                continue

            invalid_tokens = []
            for result, payload in zip(data, chunk):
                if result.get("status") != "error":
                    continue
                details = result.get("details") or {}
                error = details.get("error")
                if error == "DeviceNotRegistered":
                    invalid_tokens.append(payload.get("to"))
                else:
                    logger.warning("Expo push error: %s", error)

            invalid_tokens = [token for token in invalid_tokens if token]
            if invalid_tokens:
                UserDevice.objects.filter(expo_push_token__in=invalid_tokens).update(is_active=False)

        logger.info(f"Successfully sent daily push to {len(devices)} devices.")
    except Exception as exc:
        logger.exception("Failed to send daily push notifications: %s", exc)


@shared_task
def send_email_digests():
    """
    Sends a curated email digest to all users who have email_digest_enabled=True.
    """
    try:
        prefs = UserPreference.objects.filter(email_digest_enabled=True).select_related('user')
        users = [p.user for p in prefs if p.user.email]

        if not users:
            return
            
        top_articles = Article.objects.filter(is_active=True).order_by('-published_at', '-rank')[:3]
        if not top_articles:
            return

        # Enterprise systems usually render an HTML template.
        # For simplicity, we just send a text digest, but we'll include HTML alternative.
        subject = "The Curator: Your Daily Digest"
        
        text_content = "Here are today's top stories from The Curator:\n\n"
        html_content = "<h2>Here are today's top stories from The Curator:</h2><ul>"
        
        for article in top_articles:
            text_content += f"- {article.title} ({article.read_time_minutes} min read)\n"
            text_content += f"  {article.excerpt}\n\n"
            
            html_content += f"<li><strong>{article.title}</strong> ({article.read_time_minutes} min read)<br/>{article.excerpt}</li>"
            
        html_content += "</ul>"
        
        recipient_list = [user.email for user in users]

        send_mail(
            subject=subject,
            message=text_content,
            from_email="noreply@thecurator.app",
            recipient_list=recipient_list,
            html_message=html_content,
            fail_silently=False,
        )
        
        logger.info(f"Successfully sent daily email digests to {len(recipient_list)} users.")
    except Exception as exc:
        logger.exception("Failed to send email digests: %s", exc)
