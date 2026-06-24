"""Dispatch pipeline API sources to licensed news provider fetchers."""

from __future__ import annotations

from content_pipeline.services import (
    apitube_api,
    currents,
    guardian_api,
    gnews_api,
    mediastack_api,
    worldnews_api,
)


def is_news_api_source(source) -> bool:
    return (
        currents.is_currents_source(source)
        or guardian_api.is_guardian_source(source)
        or gnews_api.is_gnews_source(source)
        or apitube_api.is_apitube_source(source)
        or mediastack_api.is_mediastack_source(source)
        or worldnews_api.is_worldnews_source(source)
    )


def fetch_news_api_entries(source) -> list[dict]:
    if currents.is_currents_source(source):
        return currents.fetch_currents_entries(source)
    if guardian_api.is_guardian_source(source):
        return guardian_api.fetch_guardian_entries(source)
    if gnews_api.is_gnews_source(source):
        return gnews_api.fetch_gnews_entries(source)
    if apitube_api.is_apitube_source(source):
        return apitube_api.fetch_apitube_entries(source)
    if mediastack_api.is_mediastack_source(source):
        return mediastack_api.fetch_mediastack_entries(source)
    if worldnews_api.is_worldnews_source(source):
        return worldnews_api.fetch_worldnews_entries(source)
    raise ValueError(f"Unsupported news API source URL: {source.url}")
