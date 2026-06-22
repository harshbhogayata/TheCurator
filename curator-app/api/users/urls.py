from django.urls import path

from users.views import (
    AccountView,
    CurrentSessionView,
    IdentityListView,
    IdentitySyncView,
    PasswordResetRequestView,
    VerificationEmailView,
)

app_name = "users"

urlpatterns = [
    path("auth/session", CurrentSessionView.as_view(), name="auth-session"),
    path("account", AccountView.as_view(), name="account"),
    path("account/identities", IdentityListView.as_view(), name="identities"),
    path(
        "account/identities/sync",
        IdentitySyncView.as_view(),
        name="identities-sync",
    ),
    path(
        "auth/verification-email",
        VerificationEmailView.as_view(),
        name="verification-email",
    ),
    path(
        "auth/password-reset",
        PasswordResetRequestView.as_view(),
        name="password-reset",
    ),
]
