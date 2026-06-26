from rest_framework import permissions

from common.errors import EmailVerificationRequired


class EmailVerifiedForWrites(permissions.BasePermission):
    """Block mutating API calls until the user's email is verified."""

    message = "Verify your email to use this feature."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return True

        if getattr(user, "email_verified_at", None):
            return True

        raise EmailVerificationRequired()
