"""Resolve article source pills into tappable {name, url} links."""

from __future__ import annotations

from urllib.parse import urlparse

# Short codes used in seed copy and legacy ``sources`` arrays.
KNOWN_SOURCE_OUTLETS: dict[str, tuple[str, str]] = {
    "ap": ("Associated Press", "https://apnews.com/"),
    "re": ("Reuters", "https://www.reuters.com/"),
    "reuters": ("Reuters", "https://www.reuters.com/"),
    "who": ("World Health Organization", "https://www.who.int/"),
    "cdc": ("U.S. CDC", "https://www.cdc.gov/"),
    "usaid": ("USAID", "https://www.usaid.gov/"),
    "wh": ("The White House", "https://www.whitehouse.gov/"),
    "fars": ("Fars News Agency", "https://www.farsnews.ir/"),
    "nasa": ("NASA", "https://www.nasa.gov/"),
    "spx": ("SpaceX", "https://www.spacex.com/"),
    "sc": ("Scientific American", "https://www.scientificamerican.com/"),
    "oai": ("OpenAI", "https://openai.com/"),
    "nyt": ("The New York Times", "https://www.nytimes.com/"),
    "ft": ("Financial Times", "https://www.ft.com/"),
    "bbc": ("BBC", "https://www.bbc.com/"),
    "guardian": ("The Guardian", "https://www.theguardian.com/"),
    "bloomberg": ("Bloomberg", "https://www.bloomberg.com/"),
    "economist": ("The Economist", "https://www.economist.com/"),
    "nature": ("Nature", "https://www.nature.com/"),
    "wired": ("Wired", "https://www.wired.com/"),
    "mit": ("MIT Technology Review", "https://www.technologyreview.com/"),
    "un": ("United Nations", "https://www.un.org/"),
    "imf": ("IMF", "https://www.imf.org/"),
    "ecb": ("European Central Bank", "https://www.ecb.europa.eu/"),
}


def _is_http_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
    except ValueError:
        return False
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _normalize_link(raw: dict) -> dict | None:
    if not isinstance(raw, dict):
        return None
    name = str(raw.get("name") or "").strip()
    url = str(raw.get("url") or "").strip()
    if not name:
        return None
    if url and not _is_http_url(url):
        if url.startswith("www."):
            url = f"https://{url}"
        elif "." in url and " " not in url:
            url = f"https://{url}"
        else:
            url = ""
    return {"name": name, "url": url}


def _from_source_code(code: str) -> dict | None:
    token = (code or "").strip()
    if not token:
        return None
    key = token.lower().replace(".", "").replace(" ", "")
    if key in KNOWN_SOURCE_OUTLETS:
        name, url = KNOWN_SOURCE_OUTLETS[key]
        return {"name": name, "url": url}
    if _is_http_url(token):
        return {"name": token, "url": token}
    # Human-readable label without a known URL — still show the pill.
    return {"name": token.upper() if len(token) <= 5 else token, "url": ""}


def resolve_source_links(source_links: list | None, sources: list | None) -> list[dict]:
    """Prefer explicit JSON links; fall back to legacy string source codes."""
    resolved: list[dict] = []
    seen: set[str] = set()

    for raw in source_links or []:
        link = _normalize_link(raw)
        if not link:
            continue
        dedupe = f"{link['name'].lower()}|{link['url'].lower()}"
        if dedupe in seen:
            continue
        seen.add(dedupe)
        resolved.append(link)

    if resolved:
        return resolved

    for code in sources or []:
        link = _from_source_code(str(code))
        if not link:
            continue
        dedupe = f"{link['name'].lower()}|{link['url'].lower()}"
        if dedupe in seen:
            continue
        seen.add(dedupe)
        resolved.append(link)

    return resolved
