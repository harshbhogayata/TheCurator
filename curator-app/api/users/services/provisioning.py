from django.db import transaction
from django.utils import timezone

from users.models import IdentityProvider, User, UserIdentity


PROVIDER_MAP = {
    "password": IdentityProvider.EMAIL,
    "emailLink": IdentityProvider.EMAIL,
    "google.com": IdentityProvider.GOOGLE,
    "apple.com": IdentityProvider.APPLE,
}


def _provider_from_claims(claims):
    firebase_claims = claims.get("firebase", {}) if isinstance(claims, dict) else {}
    sign_in_provider = firebase_claims.get("sign_in_provider")
    return PROVIDER_MAP.get(sign_in_provider)


def _provider_from_provider_id(provider_id):
    return PROVIDER_MAP.get(provider_id)


def sync_user_identities_from_firebase_user(user: User, firebase_user):
    provider_defaults = []

    for provider_data in getattr(firebase_user, "provider_data", []) or []:
        provider = _provider_from_provider_id(getattr(provider_data, "provider_id", ""))
        if not provider:
            continue

        provider_defaults.append(
            (
                provider,
                {
                    "provider_uid": getattr(provider_data, "uid", "") or getattr(firebase_user, "uid", ""),
                    "provider_email": getattr(provider_data, "email", "") or getattr(firebase_user, "email", "") or "",
                },
            )
        )

    if not provider_defaults:
        return

    provider_names = []
    for provider, defaults in provider_defaults:
        provider_names.append(provider)
        UserIdentity.objects.update_or_create(
            user=user,
            provider=provider,
            defaults=defaults,
        )

    UserIdentity.objects.filter(user=user).exclude(provider__in=provider_names).delete()


@transaction.atomic
def provision_user_from_claims(claims):
    firebase_uid = claims["uid"]
    email = claims.get("email")

    if not email:
        raise ValueError("The Firebase token is missing an email address.")

    display_name = claims.get("name") or claims.get("display_name") or ""
    avatar_url = claims.get("picture") or ""
    provider = _provider_from_claims(claims)

    user = User.objects.filter(firebase_uid=firebase_uid).first()
    if not user:
        user = User.objects.filter(email__iexact=email).first()

    if not user:
        user = User(email=email)
        user.member_since = timezone.now()

    user.email = email
    user.firebase_uid = firebase_uid
    user.last_login_at = timezone.now()
    user.is_active = True

    if display_name:
        user.display_name = display_name
    if avatar_url:
        user.avatar_url = avatar_url
    if claims.get("email_verified") and not user.email_verified_at:
        user.email_verified_at = timezone.now()

    user.save()

    if provider:
        UserIdentity.objects.update_or_create(
            user=user,
            provider=provider,
            defaults={
                "provider_uid": firebase_uid,
                "provider_email": email,
            },
        )

    from onboarding.models import UserOnboarding, UserPreference

    UserOnboarding.objects.get_or_create(user=user)
    UserPreference.objects.get_or_create(user=user)

    return user
