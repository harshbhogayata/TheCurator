from mobileapi.category_catalog import CONTENT_CATEGORY_CATALOG

CATEGORY_OPTIONS = tuple((item["slug"], item["name"]) for item in CONTENT_CATEGORY_CATALOG)

CATEGORY_KEYS = {key for key, _ in CATEGORY_OPTIONS}
