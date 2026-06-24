"""Smoke-test ArticleDraft admin changelist (run on Railway if /admin/.../articledraft/ 500s)."""

import traceback

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.test import RequestFactory

from content_pipeline.admin import ArticleDraftAdmin
from content_pipeline.models import ArticleDraft


class Command(BaseCommand):
    help = "Debug ArticleDraft admin changelist rendering."

    def handle(self, *args, **options):
        user = get_user_model().objects.filter(is_superuser=True).first()
        if user is None:
            self.stderr.write("No superuser found.")
            return

        factory = RequestFactory()
        request = factory.get("/admin/content_pipeline/articledraft/")
        request.user = user

        admin = ArticleDraftAdmin(ArticleDraft, AdminSite())
        total = ArticleDraft.objects.count()
        self.stdout.write(f"Total drafts in DB: {total}")

        try:
            qs = admin.get_queryset(request)
            self.stdout.write(f"Changelist queryset count: {qs.count()}")
            model_admin = admin
            from django.contrib.admin.views.main import ChangeList

            cl = ChangeList(
                request,
                ArticleDraft,
                model_admin.list_display,
                model_admin.list_display_links,
                model_admin.list_filter,
                model_admin.date_hierarchy,
                model_admin.search_fields,
                model_admin.list_select_related,
                model_admin.list_per_page,
                model_admin.list_max_show_all,
                model_admin.list_editable,
                model_admin,
                model_admin.sortable_by,
                model_admin.search_help_text,
            )
            cl.get_results(request)
            self.stdout.write(self.style.SUCCESS(f"ChangeList OK — {len(cl.result_list)} row(s) on page 1."))
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"ChangeList FAILED: {exc}"))
            traceback.print_exc()
