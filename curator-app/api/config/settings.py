from pathlib import Path

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

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["127.0.0.1", "localhost"])
if RENDER_EXTERNAL_HOSTNAME and RENDER_EXTERNAL_HOSTNAME not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=["http://127.0.0.1:19006", "http://localhost:19006"],
)
render_csrf_origin = f"https://{RENDER_EXTERNAL_HOSTNAME}" if RENDER_EXTERNAL_HOSTNAME else ""
if render_csrf_origin and render_csrf_origin not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(render_csrf_origin)
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://127.0.0.1:8081",
        "http://localhost:8081",
        "http://127.0.0.1:19000",
        "http://localhost:19000",
        "http://127.0.0.1:19006",
        "http://localhost:19006",
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
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
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
    },
}

DATA_UPLOAD_MAX_MEMORY_SIZE = 128 * 1024

TRUST_PROXY = env.bool("TRUST_PROXY", default=False)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https") if TRUST_PROXY else None
USE_X_FORWARDED_HOST = TRUST_PROXY
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

FIREBASE_PROJECT_ID = env("FIREBASE_PROJECT_ID", default="")
FIREBASE_CREDENTIALS_PATH = env("FIREBASE_CREDENTIALS_PATH", default="")
FIREBASE_CREDENTIALS_JSON = env("FIREBASE_CREDENTIALS_JSON", default="")
APP_VERSION = env("APP_VERSION", default="dev")
render_public_base_url = f"https://{RENDER_EXTERNAL_HOSTNAME}" if RENDER_EXTERNAL_HOSTNAME else "http://127.0.0.1:8000"
API_PUBLIC_BASE_URL = env("API_PUBLIC_BASE_URL", default=render_public_base_url)
DATA_EXPORT_STORAGE_DIR = env("DATA_EXPORT_STORAGE_DIR", default=str(BASE_DIR / "generated_exports"))
DATA_EXPORT_ASYNC = env.bool("DATA_EXPORT_ASYNC", default=False)
DATA_EXPORT_EXPIRY_HOURS = env.int("DATA_EXPORT_EXPIRY_HOURS", default=24)
REVENUECAT_WEBHOOK_SECRET = env("REVENUECAT_WEBHOOK_SECRET", default="")
REVENUECAT_PRODUCT_TIER_MAP = env.json("REVENUECAT_PRODUCT_TIER_MAP", default={})

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

EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")

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
