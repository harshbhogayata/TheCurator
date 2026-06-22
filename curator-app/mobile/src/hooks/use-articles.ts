import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { Article } from "../data/articles";
import { queryKeys } from "../lib/query-keys";
import { useSavedArticles } from "../providers/saved-articles-provider";
import { fetchArticle, fetchArticles, fetchArticlesByIds } from "../services/mobile-api";

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
  const stableKey = [...ids].sort().join(",");
  return useQuery({
    queryKey: ["articles", "byIds", stableKey],
    queryFn: () => fetchArticlesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/** Saved tab + collection picker — IDs from context, rows always filtered to match. */
export function useSavedArticlesList() {
  const { savedArticleIds, isHydrated } = useSavedArticles();
  const orderedIds = useMemo(() => [...savedArticleIds].reverse(), [savedArticleIds]);
  const idSet = useMemo(() => new Set(savedArticleIds), [savedArticleIds]);
  const stableKey = [...orderedIds].sort().join(",");

  const query = useQuery({
    queryKey: ["articles", "byIds", stableKey],
    queryFn: () => fetchArticlesByIds(orderedIds),
    enabled: orderedIds.length > 0 && isHydrated,
    staleTime: 5 * 60 * 1000,
  });

  const articles = useMemo(
    () => (query.data ?? []).filter((article) => idSet.has(article.id)),
    [idSet, query.data],
  );

  return {
    ...query,
    data: articles,
    isHydrated,
  };
}
