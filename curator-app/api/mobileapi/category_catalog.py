from django.utils.text import slugify


CONTENT_CATEGORY_CATALOG = [
    {"slug": "news", "name": "World News", "color": "#0369a1", "icon": "newspaper", "rank": 0},
    {"slug": "economy", "name": "Economy", "color": "#0f766e", "icon": "line-chart", "rank": 1},
    {"slug": "technology", "name": "Technology", "color": "#1d4ed8", "icon": "cpu", "rank": 2},
    {"slug": "climate", "name": "Climate", "color": "#15803d", "icon": "leaf", "rank": 3},
    {"slug": "culture", "name": "Culture", "color": "#a16207", "icon": "palette", "rank": 4},
    {"slug": "health", "name": "Health", "color": "#be123c", "icon": "heart-pulse", "rank": 5},
    {"slug": "politics", "name": "Politics", "color": "#7c2d12", "icon": "landmark", "rank": 6},
    {"slug": "science", "name": "Science", "color": "#6d28d9", "icon": "flask-conical", "rank": 7},
]


def resolve_catalog_category_name(raw_value: str) -> str:
    normalized = slugify(raw_value or "")
    for item in CONTENT_CATEGORY_CATALOG:
        if normalized in {item["slug"], slugify(item["name"])}:
            return item["name"]
    return raw_value
