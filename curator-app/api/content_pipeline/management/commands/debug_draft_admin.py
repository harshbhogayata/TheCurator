"""Smoke-test ArticleDraft admin changelist (run on Railway if /admin/.../articledraft/ 500s)."""

import traceback

from django.conf import settings
from django.contrib.admin.sites import AdminSite
from django.contrib.admin.views.main import ChangeList
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Exists, OuterRef
from django.test import Client, RequestFactory

from content_pipeline.admin import ArticleDraftAdmin
from content_pipeline.models import ArticleDraft
from mobileapi.models import Category


class Command(BaseCommand):
    help = "Debug ArticleDraft admin changelist rendering (queryset, columns, full HTTP)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fix-orphans",
            action="store_true",
            help="Null out category_id on drafts pointing at deleted categories.",
        )

    def handle(self, *args, **options):
        user = get_user_model().objects.filter(is_superuser=True).first()
        if user is None:
            self.stderr.write("No superuser found.")
            return

        total = ArticleDraft.objects.count()
        self.stdout.write(f"Total drafts in DB: {total}")

        orphan_qs = ArticleDraft.objects.filter(category_id__isnull=False).annotate(
            _cat_exists=Exists(Category.objects.filter(pk=OuterRef("category_id")))
        ).filter(_cat_exists=False)
        orphan_count = orphan_qs.count()
        if orphan_count:
            self.stderr.write(
                self.style.WARNING(
                    f"Orphaned category FKs: {orphan_count} draft(s) "
                    "(this breaks admin category column rendering)."
                )
            )
            if options["fix_orphans"]:
                fixed = orphan_qs.update(category_id=None)
                self.stdout.write(self.style.SUCCESS(f"Cleared category_id on {fixed} draft(s)."))
        else:
            self.stdout.write("Orphaned category FKs: 0")

        factory = RequestFactory()
        request = factory.get("/admin/content_pipeline/articledraft/")
        request.user = user

        admin = ArticleDraftAdmin(ArticleDraft, AdminSite())

        try:
            qs = admin.get_queryset(request)
            self.stdout.write(f"Changelist queryset count: {qs.count()}")

            cl = ChangeList(
                request,
                ArticleDraft,
                admin.list_display,
                admin.list_display_links,
                admin.list_filter,
                admin.date_hierarchy,
                admin.search_fields,
                admin.list_select_related,
                admin.list_per_page,
                admin.list_max_show_all,
                admin.list_editable,
                admin,
                admin.sortable_by,
                admin.search_help_text,
            )
            cl.get_results(request)
            self.stdout.write(
                self.style.SUCCESS(f"ChangeList OK — {len(cl.result_list)} row(s) on page 1.")
            )

            for obj in cl.result_list:
                for name in admin.list_display:
                    if name in admin.list_display_links:
                        continue
                    try:
                        attr = getattr(admin, name, None)
                        if callable(attr):
                            attr(obj)
                        else:
                            getattr(obj, name)
                    except Exception as exc:
                        self.stderr.write(
                            self.style.ERROR(
                                f"list_display '{name}' failed for draft {obj.id} "
                                f"({obj.title[:50]!r}): {exc}"
                            )
                        )
                        traceback.print_exc()
                        return
            self.stdout.write(self.style.SUCCESS("All list_display columns OK for page 1."))
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"ChangeList FAILED: {exc}"))
            traceback.print_exc()
            return

        host = next(
            (h for h in settings.ALLOWED_HOSTS if h and h != "*"),
            "localhost",
        )
        client = Client(HTTP_HOST=host)
        client.force_login(user)
        response = client.get("/admin/content_pipeline/articledraft/")
        if response.status_code == 200:
            self.stdout.write(self.style.SUCCESS(f"HTTP GET changelist OK (host={host!r})."))
        else:
            self.stderr.write(
                self.style.ERROR(
                    f"HTTP GET changelist FAILED: status={response.status_code} (host={host!r})"
                )
            )
            body = response.content.decode(errors="replace")
            if "<pre class=\"exception_value\">" in body:
                start = body.index("<pre class=\"exception_value\">")
                end = body.index("</pre>", start)
                self.stderr.write(body[start:end + 6])
            else:
                self.stderr.write(body[:4000])
