"""Related-article computation: OpenAI embeddings with a topic-overlap fallback.

Embeddings are stored portably as JSON vectors (ArticleEmbedding) and compared
with cosine similarity in Python over a bounded candidate set, which avoids a
hard dependency on the pgvector extension while delivering semantic ranking.
"""

import logging
import math

import requests
from django.conf import settings

from mobileapi.models import Article, ArticleEmbedding, ArticleStatus

logger = logging.getLogger(__name__)

OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings"
EMBEDDING_MODEL = "text-embedding-3-small"
RELATED_COUNT = 3
CANDIDATE_LIMIT = 500


def embed_text(text):
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    if not api_key:
        return None
    response = requests.post(
        OPENAI_EMBEDDINGS_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": EMBEDDING_MODEL, "input": text[:8000]},
        timeout=60,
    )
    if response.status_code != 200:
        logger.warning(
            "Embedding request failed (%s): %s", response.status_code, response.text[:200]
        )
        return None
    return response.json()["data"][0]["embedding"]


def cosine_similarity(a, b):
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if not norm_a or not norm_b:
        return 0.0
    return dot / (norm_a * norm_b)


def _published_candidates(exclude_id):
    return (
        Article.objects.filter(is_active=True, status=ArticleStatus.PUBLISHED)
        .exclude(id=exclude_id)
        .order_by("-published_at")
    )


def _related_by_embedding(article):
    vector = embed_text(f"{article.title}\n\n{article.excerpt}")
    if vector is None:
        return None

    ArticleEmbedding.objects.update_or_create(
        article=article,
        defaults={"vector": vector, "model": EMBEDDING_MODEL},
    )

    candidates = ArticleEmbedding.objects.filter(
        article__in=_published_candidates(article.id)[:CANDIDATE_LIMIT]
    ).select_related("article")

    scored = [
        (cosine_similarity(vector, candidate.vector), str(candidate.article_id))
        for candidate in candidates
    ]
    scored.sort(reverse=True)
    return [article_id for score, article_id in scored[:RELATED_COUNT] if score > 0.2]


def _related_by_topics(article):
    topics = {str(topic).lower() for topic in (article.topics or [])}
    candidates = _published_candidates(article.id)[:200]

    scored = []
    for candidate in candidates:
        candidate_topics = {str(topic).lower() for topic in (candidate.topics or [])}
        overlap = len(topics & candidate_topics)
        same_category = 1 if candidate.category_id == article.category_id else 0
        score = overlap * 2 + same_category
        if score > 0:
            scored.append((score, str(candidate.id)))
    scored.sort(reverse=True)
    return [article_id for _score, article_id in scored[:RELATED_COUNT]]


def compute_related_articles(article):
    """Compute and persist related_article_ids for an article."""
    related = _related_by_embedding(article)
    if related is None:
        related = _related_by_topics(article)

    article.related_article_ids = related
    article.save(update_fields=["related_article_ids", "updated_at"])
    return related
