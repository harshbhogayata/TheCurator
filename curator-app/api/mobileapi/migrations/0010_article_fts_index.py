"""Full-text search GIN index for Article (Postgres only).

Applied conditionally so local SQLite development databases keep working;
production Postgres gets the expression index used by
mobileapi.personalization.annotate_search.
"""

from django.db import migrations

CREATE_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS article_fts_idx
ON mobileapi_article
USING GIN (
    to_tsvector(
        'english',
        coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')
    )
);
"""

DROP_INDEX_SQL = "DROP INDEX IF EXISTS article_fts_idx;"


def create_index(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute(CREATE_INDEX_SQL)


def drop_index(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute(DROP_INDEX_SQL)


class Migration(migrations.Migration):
    dependencies = [
        ("mobileapi", "0009_article_related_article_ids_articleembedding"),
    ]

    operations = [
        migrations.RunPython(create_index, drop_index),
    ]
