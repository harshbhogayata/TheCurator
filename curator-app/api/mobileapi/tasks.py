import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.html import escape

from mobileapi.export_services import generate_data_export
from mobileapi.models import Article, ArticleStatus, Brief
from mobileapi.personalization import personalized_category_slugs
from mobileapi.push import notify_users
from onboarding.models import NotificationFrequency, UserPreference

logger = logging.getLogger(__name__)

# Breaking alerts go to anyone who wants notifications at all; scheduled
# digests only go to users on the matching cadence.
BREAKING_FREQUENCIES = (
    NotificationFrequency.DAILY,
    NotificationFrequency.BREAKING,
    NotificationFrequency.WEEKLY,
)


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


def _top_article():
    return (
        Article.objects.filter(is_active=True, status=ArticleStatus.PUBLISHED)
        .order_by("-published_at", "-rank")
        .first()
    )


def _today_brief():
    return (
        Brief.objects.filter(is_active=True, published_at=timezone.localdate())
        .order_by("rank", "-created_at")
        .first()
    )


@shared_task
def send_daily_push_notifications():
    """Daily briefing push for users on the 'daily' notification cadence."""
    try:
        user_ids = list(
            UserPreference.objects.filter(
                push_enabled=True,
                notification_frequency=NotificationFrequency.DAILY,
            ).values_list("user_id", flat=True)
        )
        if not user_ids:
            return

        brief = _today_brief()
        if not brief:
            logger.info("No brief available for daily push.")
            return

        delivered = notify_users(
            user_ids,
            title="Your Daily Curated Briefing",
            body=brief.title,
            url=f"/brief/{brief.id}",
        )
        logger.info("Sent daily push to %d device(s).", delivered)
    except Exception as exc:
        logger.exception("Failed to send daily push notifications: %s", exc)


@shared_task
def send_weekly_push_notifications():
    """Weekly recap push for users on the 'weekly' cadence."""
    try:
        user_ids = list(
            UserPreference.objects.filter(
                push_enabled=True,
                notification_frequency=NotificationFrequency.WEEKLY,
            ).values_list("user_id", flat=True)
        )
        if not user_ids:
            return

        top_article = _top_article()
        if not top_article:
            return

        delivered = notify_users(
            user_ids,
            title="Your Weekly Curator Recap",
            body=f"This week's most important story: {top_article.title}",
            url=f"/article/{top_article.id}",
        )
        logger.info("Sent weekly push to %d device(s).", delivered)
    except Exception as exc:
        logger.exception("Failed to send weekly push notifications: %s", exc)


@shared_task
def send_breaking_news_alert(article_id):
    """Immediate push for a breaking story, sent to everyone opted into push."""
    try:
        article = Article.objects.filter(
            id=article_id, is_active=True, status=ArticleStatus.PUBLISHED
        ).first()
        if article is None:
            return

        user_ids = list(
            UserPreference.objects.filter(
                push_enabled=True,
                notification_frequency__in=BREAKING_FREQUENCIES,
            ).values_list("user_id", flat=True)
        )
        if not user_ids:
            return

        delivered = notify_users(
            user_ids,
            title="Breaking news",
            body=article.title,
            url=f"/article/{article.id}",
        )
        logger.info("Sent breaking alert for %s to %d device(s).", article_id, delivered)
    except Exception as exc:
        logger.exception("Failed to send breaking news alert: %s", exc)


def _digest_articles_for_user(user, limit=3):
    """Personalized digest picks: preferred categories first, then global top."""
    base = Article.objects.filter(is_active=True, status=ArticleStatus.PUBLISHED)
    slugs = personalized_category_slugs(user)
    articles = []
    if slugs:
        articles = list(
            base.filter(category__slug__in=slugs).order_by("-published_at", "-rank")[:limit]
        )
    if len(articles) < limit:
        seen = {a.id for a in articles}
        for article in base.order_by("-published_at", "-rank")[: limit * 2]:
            if article.id not in seen:
                articles.append(article)
                seen.add(article.id)
            if len(articles) >= limit:
                break
    return articles


def _render_digest(articles, *, heading):
    text_content = f"{heading}\n\n"
    html_content = f"<h2>{escape(heading)}</h2><ul>"
    for article in articles:
        safe_title = escape(article.title)
        safe_excerpt = escape(article.excerpt)
        text_content += f"- {article.title} ({article.read_time_minutes} min read)\n"
        text_content += f"  {article.excerpt}\n\n"
        html_content += (
            f"<li><strong>{safe_title}</strong> ({article.read_time_minutes} min read)"
            f"<br/>{safe_excerpt}</li>"
        )
    html_content += "</ul>"
    return text_content, html_content


@shared_task
def send_email_digests(frequency=NotificationFrequency.DAILY):
    """Personalized email digest for users on the given notification cadence."""
    try:
        prefs = UserPreference.objects.filter(
            email_digest_enabled=True,
            notification_frequency=frequency,
        ).select_related("user")
        users = [p.user for p in prefs if p.user.email]
        if not users:
            return

        is_weekly = frequency == NotificationFrequency.WEEKLY
        subject = (
            "The Curator: Your Weekly Digest" if is_weekly else "The Curator: Your Daily Digest"
        )
        heading = (
            "Here are this week's top stories, picked for you:"
            if is_weekly
            else "Here are today's top stories, picked for you:"
        )

        sent = 0
        for user in users:
            articles = _digest_articles_for_user(user)
            if not articles:
                continue
            text_content, html_content = _render_digest(articles, heading=heading)
            try:
                send_mail(
                    subject=subject,
                    message=text_content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=html_content,
                    fail_silently=False,
                )
                sent += 1
            except Exception as e:
                logger.error(f"Failed to send email digest to {user.email}: {e}")

        logger.info("Sent %s email digests to %d user(s).", frequency, sent)
    except Exception as exc:
        logger.exception("Failed to send email digests: %s", exc)
