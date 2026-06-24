"""Daily/monthly request budgets for licensed news API providers."""

from __future__ import annotations

from datetime import date

from django.core.cache import cache


def _daily_cache_key(provider: str) -> str:
    return f"news_api:{provider}:day:{date.today().isoformat()}"


def _monthly_cache_key(provider: str) -> str:
    return f"news_api:{provider}:month:{date.today().strftime('%Y-%m')}"


def budget_remaining(provider: str, limit: int, *, period: str = "day") -> int:
    key = _monthly_cache_key(provider) if period == "month" else _daily_cache_key(provider)
    used = int(cache.get(key, 0) or 0)
    return max(0, limit - used)


def record_request(provider: str, *, period: str = "day", count: int = 1) -> None:
    key = _monthly_cache_key(provider) if period == "month" else _daily_cache_key(provider)
    try:
        if cache.add(key, count, timeout=86_400 if period == "day" else 2_678_400):
            return
        cache.incr(key, count)
    except Exception:
        pass
