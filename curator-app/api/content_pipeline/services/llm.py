"""LLM rewriting: turn StoryClusters into Curator-voice drafts via OpenAI."""

import json
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"
REQUEST_TIMEOUT = 180

ARTICLE_SYSTEM_PROMPT = """\
You are the senior writer for Curator, a calm, editorial long-form news app.
You synthesize reporting from multiple outlets into one clear, neutral,
self-contained article in Curator's voice: measured, precise, explanatory,
no clickbait, no first person, no hedging filler. Attribute facts to their
outlets inline where it matters ("according to Reuters"). Write for an
intelligent general reader.

Respond with a single JSON object with exactly these keys:
- "title": headline, max 110 characters, sentence case, no clickbait
- "excerpt": 1-2 sentence standfirst, max 280 characters
- "content": the full article, 600-1100 words, paragraphs separated by a
  blank line, no markdown headings, no bullet lists
- "category": one of the provided category slugs that fits best
- "topics": 3-6 short lowercase topic tags
- "image_query": a 2-5 word stock-photo search phrase for the hero image
- "is_breaking": true only for major, fast-moving news
"""

BRIEF_SYSTEM_PROMPT = """\
You are the editor of Curator's daily audio brief. Given the last day's published
articles, write a single spoken-word brief in Curator's calm editorial voice:
a flowing narration that connects the day's stories, suitable for text-to-speech.
No markdown, no headings, no bullet points - plain paragraphs only.
Aim for roughly 5-10 minutes when read aloud (about 900-1400 words).

Respond with a single JSON object with exactly these keys:
- "title": the brief's title, max 90 characters (e.g. "Your Tuesday briefing")
- "summary": the full narration script, 900-1400 words, paragraphs separated
  by a blank line; open with a one-sentence overview, then weave stories together
- "insights": integer count of distinct stories covered
"""


class LlmError(RuntimeError):
    pass


def _chat_json(system_prompt, user_prompt, *, model=None):
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        raise LlmError("OPENAI_API_KEY is not configured.")
    model = model or getattr(settings, "OPENAI_CHAT_MODEL", "gpt-4o-mini")

    response = requests.post(
        OPENAI_CHAT_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4,
        },
        timeout=REQUEST_TIMEOUT,
    )
    if response.status_code != 200:
        raise LlmError(
            f"OpenAI chat request failed ({response.status_code}): {response.text[:300]}"
        )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        return json.loads(content), model
    except (KeyError, IndexError, ValueError) as exc:
        raise LlmError(f"Unexpected OpenAI chat response shape: {exc}") from exc


def estimate_read_time_minutes(content):
    words = len((content or "").split())
    return max(1, min(30, round(words / 220)))


def rewrite_cluster_to_article(cluster, items, *, category_slugs):
    """Generate an article draft payload from a story cluster.

    Returns (payload dict, model name). Raises LlmError on failure.
    """
    sources_block = []
    for item in items:
        sources_block.append(
            f"OUTLET: {item.source.name}\n"
            f"TITLE: {item.title}\n"
            f"URL: {item.url}\n"
            f"SUMMARY: {item.summary[:1500]}"
        )

    user_prompt = (
        f"Category slugs to choose from: {', '.join(category_slugs)}\n\n"
        f"Story: {cluster.title}\n\n"
        "Source reporting:\n\n" + "\n\n---\n\n".join(sources_block)
    )

    payload, model = _chat_json(ARTICLE_SYSTEM_PROMPT, user_prompt)

    for key in ("title", "excerpt", "content"):
        if not str(payload.get(key, "")).strip():
            raise LlmError(f"LLM article payload missing '{key}'.")

    return payload, model


def write_daily_brief(articles):
    """Generate a daily brief payload from today's published articles."""
    stories_block = []
    for article in articles:
        category = article.category.name if article.category_id else "News"
        stories_block.append(
            f"TITLE: {article.title}\n"
            f"CATEGORY: {category}\n"
            f"EXCERPT: {article.excerpt[:500]}"
        )

    user_prompt = "Today's published stories:\n\n" + "\n\n---\n\n".join(stories_block)
    payload, model = _chat_json(BRIEF_SYSTEM_PROMPT, user_prompt)

    for key in ("title", "summary"):
        if not str(payload.get(key, "")).strip():
            raise LlmError(f"LLM brief payload missing '{key}'.")

    return payload, model
