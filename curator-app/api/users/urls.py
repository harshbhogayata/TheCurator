from django.urls import path

from users.views import AccountView, CurrentSessionView, IdentityListView, IdentitySyncView

urlpatterns = [
    path("auth/session", CurrentSessionView.as_view(), name="mobile-auth-session"),
    path("account", AccountView.as_view(), name="mobile-account"),
    path("account/identities", IdentityListView.as_view(), name="mobile-identities"),
    path(
        "account/identities/sync",
        IdentitySyncView.as_view(),
        name="mobile-identities-sync",
    ),
]
