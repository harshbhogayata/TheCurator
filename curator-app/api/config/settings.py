from pathlib import Path
from urllib.parse import urlparse

import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DJANGO_DEBUG=(bool, False),
)
environ.Env.read_env(BASE_DIR / ".env")

DEBUG = env("DJANGO_DEBUG")

def _get_secret_key():
    secret_key = env("DJANGO_SECRET_KEY", default="")

    if secret_key:
        return secret_key

    if DEBUG:
        return "django-insecure-curator-mobile-rewrite-dev-only"

    raise ImproperlyConfigured("DJANGO_SECRET_KEY is required when DJANGO_DEBUG is false.")


SECRET_KEY = _get_secret_key()
RENDER_EXTERNAL_HOSTNAME = env("RENDER_EXTERNAL_HOSTNAME", default="")
RAILWAY_PUBLIC_DOMAIN = env("RAILWAY_PUBLIC_DOMAIN", default="")
RAILWAY_ENVIRONMENT = env("RAILWAY_ENVIRONMENT", default="")
ON_RAILWAY = bool(RAILWAY_PUBLIC_DOMAIN or RAILWAY_ENVIRONMENT)
API_PUBLIC_BASE_URL_ENV = env("API_PUBLIC_BASE_URL", default="")

ALLOWED_HOSTS = env.list(
    "DJANGO_ALLOWED_HOSTS",
    default=["127.0.0.1", "localhost"] if DEBUG else [],
)
if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
if RAILWAY_PUBLIC_DOMAIN and RAILWAY_PUBLIC_DOMAIN not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RAILWAY_PUBLIC_DOMAIN)
# Railway healthchecks use internal HTTP + healthcheck.railway.app Host header.
if ON_RAILWAY:
    for host in (
        "127.0.0.1",
        "localhost",
        "healthcheck.railway.app",
        ".up.railway.app",
        ".railway.internal",
    ):
        if host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(host)
if API_PUBLIC_BASE_URL_ENV:
    api_public_host = urlparse(API_PUBLIC_BASE_URL_ENV).hostname
    if api_public_host and api_public_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(api_public_host)
if not DEBUG and not ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS or a platform public domain is required in production.")

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=["http://127.0.0.1:19006", "http://localhost:19006"],
)
render_csrf_origin = f"https://{RENDER_EXTERNAL_HOSTNAME}" if RENDER_EXTERNAL_HOSTNAME else ""
if render_csrf_origin and render_csrf_origin not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(render_csrf_origin)
railway_csrf_origin = f"https://{RAILWAY_PUBLIC_DOMAIN}" if RAILWAY_PUBLIC_DOMAIN else ""
if railway_csrf_origin and railway_csrf_origin not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(railway_csrf_origin)
if API_PUBLIC_BASE_URL_ENV:
    parsed_api_public_url = urlparse(API_PUBLIC_BASE_URL_ENV)
    if parsed_api_public_url.scheme and parsed_api_public_url.netloc:
        api_public_origin = f"{parsed_api_public_url.scheme}://{parsed_api_public_url.netloc}"
        if api_public_origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(api_public_origin)
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://127.0.0.1:8081",
        "http://localhost:8081",
        "http://127.0.0.1:19000",
        "http://localhost:19000",
        "http://127.0.0.1:19006",
        "http://localhost:19006",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
)

AUTH_USER_MODEL = "users.User"

INSTALLED_APPS = [
    "corsheaders",
    "rest_framework",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "common",
    "mobileapi",
    "users",
    "onboarding",
    "health",
    "content_pipeline",
    "publicapi",
    "billing",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "common.middleware.RequestIdMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "common.middleware.RequestLoggingMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

if DEBUG:
    DATABASES = {
        "default": env.db(
            "DATABASE_URL",
            default="postgresql://curator:curator@127.0.0.1:5432/curator",
        )
    }
else:
    database_url = env("DATABASE_URL", default="")
    if not database_url:
        raise ImproperlyConfigured(
            "DATABASE_URL is not set or is empty in the environment. "
            "Please configure the DATABASE_URL environment variable in your production host (e.g. referencing ${{Postgres.DATABASE_URL}} in Railway)."
        )
    DATABASES = {
        "default": env.db("DATABASE_URL"),
    }

DATABASES["default"]["CONN_MAX_AGE"] = env.int("CONN_MAX_AGE", default=0 if DEBUG else 600)

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    }
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"

USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.authentication.FirebaseAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "EXCEPTION_HANDLER": "common.errors.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "users.throttling.ScopedUserThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "reads": "300/minute",
        "writes": "60/minute",
        "reading_events": "600/hour",
        "auth_session": "20/minute",
        "sensitive": "5/minute",
        "search": "30/minute",
        "feedback": "5/hour",
        "public_reads": "240/minute",
        "launch_notify": "10/hour",
        "webhooks": "120/minute",
    },
}

DATA_UPLOAD_MAX_MEMORY_SIZE = 128 * 1024

TRUST_PROXY = env.bool("TRUST_PROXY", default=False)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https") if TRUST_PROXY else None
USE_X_FORWARDED_HOST = TRUST_PROXY
# Railway probes over plain HTTP; SECURE_SSL_REDIRECT would 301 the healthcheck.
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False if ON_RAILWAY else not DEBUG)
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = env("SESSION_COOKIE_SAMESITE", default="Lax")
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = env.bool("CSRF_COOKIE_HTTPONLY", default=False)
CSRF_COOKIE_SAMESITE = env("CSRF_COOKIE_SAMESITE", default="Lax")
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=0 if DEBUG else 31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool(
    "SECURE_HSTS_INCLUDE_SUBDOMAINS",
    default=not DEBUG,
)
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=not DEBUG)
SECURE_CONTENT_TYPE_NOSNIFF = True

FIREBASE_PROJECT_ID = env("FIREBASE_PROJECT_ID", default="")
FIREBASE_CREDENTIALS_PATH = env("FIREBASE_CREDENTIALS_PATH", default="")
FIREBASE_CREDENTIALS_JSON = env("FIREBASE_CREDENTIALS_JSON", default="")
FIREBASE_CLOCK_SKEW_SECONDS = env.int("FIREBASE_CLOCK_SKEW_SECONDS", default=60)
if not 0 <= FIREBASE_CLOCK_SKEW_SECONDS <= 60:
    raise ImproperlyConfigured("FIREBASE_CLOCK_SKEW_SECONDS must be between 0 and 60.")
FIREBASE_LOCAL_CLOCK_OFFSET_SECONDS = env.int(
    "FIREBASE_LOCAL_CLOCK_OFFSET_SECONDS",
    default=0,
)
if not 0 <= FIREBASE_LOCAL_CLOCK_OFFSET_SECONDS <= 300:
    raise ImproperlyConfigured(
        "FIREBASE_LOCAL_CLOCK_OFFSET_SECONDS must be between 0 and 300.",
    )
if not DEBUG and FIREBASE_LOCAL_CLOCK_OFFSET_SECONDS:
    raise ImproperlyConfigured(
        "FIREBASE_LOCAL_CLOCK_OFFSET_SECONDS is a local-development escape hatch only.",
    )
APP_VERSION = env("APP_VERSION", default="dev")


def _get_api_public_base_url():
    if API_PUBLIC_BASE_URL_ENV:
        parsed = urlparse(API_PUBLIC_BASE_URL_ENV)
        if not parsed.scheme or not parsed.netloc:
            raise ImproperlyConfigured("API_PUBLIC_BASE_URL must be an absolute URL.")
        if not DEBUG and parsed.scheme != "https":
            raise ImproperlyConfigured("API_PUBLIC_BASE_URL must use HTTPS in production.")
        return API_PUBLIC_BASE_URL_ENV.rstrip("/")

    if RENDER_EXTERNAL_HOSTNAME:
        return f"https://{RENDER_EXTERNAL_HOSTNAME}"
    if RAILWAY_PUBLIC_DOMAIN:
        return f"https://{RAILWAY_PUBLIC_DOMAIN}"
    if DEBUG:
        return "http://127.0.0.1:8000"

    raise ImproperlyConfigured(
        "API_PUBLIC_BASE_URL, RENDER_EXTERNAL_HOSTNAME, or RAILWAY_PUBLIC_DOMAIN is required in production."
    )


API_PUBLIC_BASE_URL = _get_api_public_base_url()
DATA_EXPORT_STORAGE_DIR = env("DATA_EXPORT_STORAGE_DIR", default=str(BASE_DIR / "generated_exports"))
DATA_EXPORT_ASYNC = env.bool("DATA_EXPORT_ASYNC", default=False)
DATA_EXPORT_EXPIRY_HOURS = env.int("DATA_EXPORT_EXPIRY_HOURS", default=24)
REVENUECAT_WEBHOOK_SECRET = env("REVENUECAT_WEBHOOK_SECRET", default="")
REVENUECAT_API_KEY = env("REVENUECAT_API_KEY", default="")
REVENUECAT_PRODUCT_TIER_MAP = env.json("REVENUECAT_PRODUCT_TIER_MAP", default={})

# Stripe (web checkout). Maps subscription tiers to Stripe Price IDs, e.g.
# {"basic": "price_123", "premium": "price_456", "lifetime": "price_789"}.
STRIPE_SECRET_KEY = env("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = env("STRIPE_WEBHOOK_SECRET", default="")
STRIPE_TIER_PRICE_MAP = env.json("STRIPE_TIER_PRICE_MAP", default={})
# Public web app origin used for checkout/portal redirect URLs.
WEB_BASE_URL = env("WEB_BASE_URL", default="http://localhost:3000" if DEBUG else "https://thecuratorgroup.org")

_parsed_web_base = urlparse(WEB_BASE_URL)
if _parsed_web_base.scheme and _parsed_web_base.netloc:
    _web_origin = f"{_parsed_web_base.scheme}://{_parsed_web_base.netloc}"
    if _web_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(_web_origin)
    if _parsed_web_base.hostname and not _parsed_web_base.hostname.startswith("www."):
        _www_origin = f"{_parsed_web_base.scheme}://www.{_parsed_web_base.hostname}"
        if _www_origin not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(_www_origin)
    if _web_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_web_origin)
    if _parsed_web_base.hostname and not _parsed_web_base.hostname.startswith("www."):
        if _www_origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(_www_origin)

# Web Push (VAPID). Generate keys with: python -m py_vapid (or `npx web-push generate-vapid-keys`).
WEBPUSH_VAPID_PUBLIC_KEY = env("WEBPUSH_VAPID_PUBLIC_KEY", default="")
WEBPUSH_VAPID_PRIVATE_KEY = env("WEBPUSH_VAPID_PRIVATE_KEY", default="")
WEBPUSH_VAPID_CLAIMS_EMAIL = env("WEBPUSH_VAPID_CLAIMS_EMAIL", default="")

# Article narration (OpenAI TTS) + media storage (S3-compatible, e.g. Cloudflare R2).
# Used only by the `generate_article_audio` management command; the app never
# needs these at runtime because audio is served from AUDIO_PUBLIC_BASE_URL.
OPENAI_API_KEY = env("OPENAI_API_KEY", default="")
OPENAI_TTS_MODEL = env("OPENAI_TTS_MODEL", default="gpt-4o-mini-tts")
OPENAI_TTS_VOICE = env("OPENAI_TTS_VOICE", default="alloy")

# Content pipeline (RSS/API ingestion + LLM rewriting + editorial review).
OPENAI_CHAT_MODEL = env("OPENAI_CHAT_MODEL", default="gpt-4o-mini")
PIPELINE_ENABLED = env.bool("PIPELINE_ENABLED", default=True)
# When True, approved drafts publish automatically; otherwise editors publish
# from the review queue in Django admin.
PIPELINE_AUTO_PUBLISH = env.bool("PIPELINE_AUTO_PUBLISH", default=False)
PIPELINE_MAX_DRAFTS_PER_RUN = env.int("PIPELINE_MAX_DRAFTS_PER_RUN", default=10)
PIPELINE_MIN_CLUSTER_SOURCES = env.int("PIPELINE_MIN_CLUSTER_SOURCES", default=1)
AUDIO_S3_ENDPOINT_URL = env("AUDIO_S3_ENDPOINT_URL", default="")
AUDIO_S3_BUCKET = env("AUDIO_S3_BUCKET", default="")
AUDIO_S3_ACCESS_KEY_ID = env("AUDIO_S3_ACCESS_KEY_ID", default="")
AUDIO_S3_SECRET_ACCESS_KEY = env("AUDIO_S3_SECRET_ACCESS_KEY", default="")
AUDIO_S3_REGION = env("AUDIO_S3_REGION", default="auto")
AUDIO_PUBLIC_BASE_URL = env("AUDIO_PUBLIC_BASE_URL", default="")

SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        send_default_pii=False,
        traces_sample_rate=env.float("SENTRY_TRACES_SAMPLE_RATE", default=0.0),
    )

CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default=CELERY_BROKER_URL)
CELERY_TIMEZONE = TIME_ZONE

# Server-side cache for hot public feeds. Uses Redis when available
# (REDIS_URL, or the Celery broker in production), otherwise an in-process
# fallback. In DEBUG, Redis must be opted into explicitly so local dev and
# tests never depend on a running Redis instance.
REDIS_CACHE_URL = env("REDIS_URL", default="" if DEBUG else CELERY_BROKER_URL)
if REDIS_CACHE_URL and REDIS_CACHE_URL.startswith("redis"):
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_CACHE_URL,
            "TIMEOUT": 300,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "curator-default",
            "TIMEOUT": 300,
        }
    }

EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@thecuratorgroup.org")
RESEND_API_KEY = env("RESEND_API_KEY", default="")
RESEND_FROM_EMAIL = env("RESEND_FROM_EMAIL", default=DEFAULT_FROM_EMAIL)
LAUNCH_NOTIFY_FORWARD_ENABLED = env.bool("LAUNCH_NOTIFY_FORWARD_ENABLED", default=True)
LAUNCH_NOTIFY_FORWARD_EMAIL = env("LAUNCH_NOTIFY_FORWARD_EMAIL", default="harsh@thecuratorgroup.org")
LAUNCH_NOTIFY_SEND_CONFIRMATION = env.bool("LAUNCH_NOTIFY_SEND_CONFIRMATION", default=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "sensitive": {
            "()": "common.middleware.SensitiveLogFilter",
        }
    },
    "formatters": {
        "standard": {
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "filters": ["sensitive"],
            "formatter": "standard",
        }
    },
    "loggers": {
        "curator.requests": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        }
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}
