"""API-hosted Firebase auth action pages (always deployed with the API)."""

from __future__ import annotations

import json

from django.conf import settings
from django.views.generic import TemplateView


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
