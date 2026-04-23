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
