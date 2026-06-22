"""API-hosted Firebase auth action pages (always deployed with the API)."""

from __future__ import annotations

import json

from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView

from users.services.firebase_identity import FirebaseIdentityError, apply_email_verification, confirm_password_reset


def _firebase_page_config() -> dict:
    project_id = settings.FIREBASE_PROJECT_ID or ""
    auth_domain = settings.FIREBASE_WEB_AUTH_DOMAIN or (
        f"{project_id}.firebaseapp.com" if project_id else ""
    )
    return {
        "apiKey": settings.FIREBASE_WEB_API_KEY or "",
        "authDomain": auth_domain,
        "projectId": project_id,
        "appId": settings.FIREBASE_WEB_APP_ID or "",
    }


class MobileResetPasswordPageView(TemplateView):
    template_name = "users/mobile_reset_password.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["firebase_config_json"] = json.dumps(_firebase_page_config())
        return context


class MobileVerifyEmailPageView(TemplateView):
    template_name = "users/mobile_verify_email.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["firebase_config_json"] = json.dumps(_firebase_page_config())
        return context


@method_decorator(csrf_exempt, name="dispatch")
class MobileResetPasswordConfirmView(View):
    def post(self, request):
        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid request body."}, status=400)

        oob_code = str(body.get("oobCode") or "").strip()
        password = str(body.get("password") or "")
        if not oob_code:
            return JsonResponse({"detail": "Missing reset code.", "code": "invalid_action_code"}, status=400)
        if len(password.strip()) < 8:
            return JsonResponse({"detail": "Use at least 8 characters.", "code": "weak_password"}, status=400)

        try:
            confirm_password_reset(oob_code=oob_code, new_password=password.strip())
        except FirebaseIdentityError as exc:
            status = 400
            if exc.code == "misconfigured":
                status = 503
            elif exc.code not in {
                "invalid_action_code",
                "expired_action_code",
                "weak_password",
                "too_many_attempts",
            }:
                status = 502
            return JsonResponse({"detail": str(exc), "code": exc.code}, status=status)

        return JsonResponse({"detail": "Password updated."})


@method_decorator(csrf_exempt, name="dispatch")
class MobileVerifyEmailConfirmView(View):
    def post(self, request):
        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"detail": "Invalid request body."}, status=400)

        oob_code = str(body.get("oobCode") or "").strip()
        if not oob_code:
            return JsonResponse({"detail": "Missing verification code.", "code": "invalid_action_code"}, status=400)

        try:
            apply_email_verification(oob_code=oob_code)
        except FirebaseIdentityError as exc:
            status = 400
            if exc.code == "misconfigured":
                status = 503
            elif exc.code not in {"invalid_action_code", "expired_action_code"}:
                status = 502
            return JsonResponse({"detail": str(exc), "code": exc.code}, status=status)

        return JsonResponse({"detail": "Email verified."})
