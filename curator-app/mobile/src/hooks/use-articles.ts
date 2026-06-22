import { useQuery } from "@tanstack/react-query";

import type { Article } from "../data/articles";
import { queryKeys } from "../lib/query-keys";
import { fetchAllArticles, fetchArticle, fetchArticles, fetchArticlesByIds } from "../services/mobile-api";

async function fetchArticlesQuery(filters?: Record<string, unknown>): Promise<Article[]> {
  return fetchArticles(filters);
}

async function fetchArticleQuery(id: string): Promise<Article | null> {
  if (!id) {
    return null;
  }

  return fetchArticle(id);
}

export function useArticles(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn: () => fetchArticlesQuery(filters),
    staleTime: 30 * 60 * 1000,
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

export function useArticlesByIds(ids: string[]) {
  const stableIds = [...ids].sort();
  return useQuery({
    queryKey: ["articles", "byIds", stableIds],
    queryFn: () => fetchArticlesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSavedArticlesList() {
  return useQuery({
    queryKey: queryKeys.saved.list(),
    queryFn: () => fetchAllArticles({ savedOnly: true }),
    staleTime: 5 * 60 * 1000,
  });
}
