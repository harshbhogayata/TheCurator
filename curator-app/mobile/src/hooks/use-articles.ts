import { useQuery } from "@tanstack/react-query";

import { articles } from "../data/articles";
import type { Article } from "../data/articles";
import { queryKeys } from "../lib/query-keys";
import { fetchArticle, fetchArticles } from "../services/mobile-api";

const MOCK_BACKEND = process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";

async function fetchArticlesQuery(filters?: Record<string, unknown>): Promise<Article[]> {
  if (MOCK_BACKEND) {
    return articles;
  }

  return fetchArticles(filters);
}

async function fetchArticleQuery(id: string): Promise<Article | null> {
  if (!id) {
    return null;
  }

  if (MOCK_BACKEND) {
    return articles.find((a) => a.id === id) ?? null;
  }

  try {
    return await fetchArticle(id);
  } catch {
    return null;
  }
}

export function useArticles(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn: () => fetchArticlesQuery(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: () => fetchArticleQuery(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
