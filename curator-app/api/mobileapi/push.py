"""Push delivery: Expo (iOS/Android) + Web Push (VAPID) via UserDevice."""

import json
import logging

import requests
from django.conf import settings

from mobileapi.models import DevicePlatform, UserDevice

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
EXPO_CHUNK_SIZE = 100


def web_push_configured():
    return bool(settings.WEBPUSH_VAPID_PRIVATE_KEY and settings.WEBPUSH_VAPID_CLAIMS_EMAIL)


def send_expo_messages(messages):
    """Send Expo push messages in chunks, deactivating dead tokens."""
    sent = 0
    for i in range(0, len(messages), EXPO_CHUNK_SIZE):
        chunk = messages[i : i + EXPO_CHUNK_SIZE]
        try:
            response = requests.post(
                EXPO_PUSH_URL,
                json=chunk,
                headers={
                    "Accept": "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.warning("Expo push request failed: %s", exc)
            continue

        sent += len(chunk)
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
            UserDevice.objects.filter(expo_push_token__in=invalid_tokens).update(
                is_active=False
            )
    return sent


def send_web_push(device, payload):
    """Send a single Web Push notification; deactivates expired subscriptions."""
    if not web_push_configured():
        return False

    subscription = device.web_push_subscription or {}
    if not subscription.get("endpoint"):
        return False

    from pywebpush import WebPushException, webpush

    try:
        webpush(
            subscription_info=subscription,
            data=json.dumps(payload),
            vapid_private_key=settings.WEBPUSH_VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{settings.WEBPUSH_VAPID_CLAIMS_EMAIL}"},
        )
        return True
    except WebPushException as exc:
        status_code = getattr(exc.response, "status_code", None)
        if status_code in (404, 410):
            UserDevice.objects.filter(id=device.id).update(is_active=False)
        else:
            logger.warning("Web push failed for device %s: %s", device.id, exc)
        return False


def notify_users(user_ids, *, title, body, url=""):
    """Deliver a notification to all active devices (Expo + Web) of the users."""
    if not user_ids:
        return 0

    devices = list(
        UserDevice.objects.filter(user_id__in=user_ids, is_active=True)
    )

    expo_messages = []
    delivered = 0
    for device in devices:
        if device.platform == DevicePlatform.WEB:
            payload = {"title": title, "body": body, "url": url}
            if send_web_push(device, payload):
                delivered += 1
        elif device.expo_push_token:
            expo_messages.append(
                {
                    "to": device.expo_push_token,
                    "sound": "default",
                    "title": title,
                    "body": body,
                    "data": {"url": url},
                }
            )

    delivered += send_expo_messages(expo_messages)
    return delivered
