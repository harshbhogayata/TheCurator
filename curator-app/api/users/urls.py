from django.urls import path

from users.views import AccountView, CurrentSessionView, IdentityListView, IdentitySyncView

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
]
