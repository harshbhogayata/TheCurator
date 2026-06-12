import { useQuery } from "@tanstack/react-query";

import type { Article } from "../data/articles";
import { filterMockArticles, findMockArticle, mockArticles } from "../data/mock-content";
import { isMockBackend } from "../lib/dev-mode";
import { queryKeys } from "../lib/query-keys";
import { fetchAllArticles, fetchArticle, fetchArticles, fetchArticlesByIds } from "../services/mobile-api";

export function useArticles(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.articles.list(filters),
    queryFn: () =>
      isMockBackend ? Promise.resolve(filterMockArticles(filters)) : fetchArticles(filters),
    staleTime: 30 * 60 * 1000,
  });
}

export function useForYouArticles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.articles.list({ feed: "for_you" }),
    queryFn: () =>
      isMockBackend
        ? Promise.resolve(filterMockArticles(undefined))
        : fetchArticles({ feed: "for_you" }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: (): Promise<Article | null> =>
      isMockBackend
        ? Promise.resolve(findMockArticle(id))
        : fetchArticle(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useArticlesByIds(ids: string[]) {
  const stableIds = [...ids].sort();
  return useQuery({
    queryKey: ["articles", "byIds", stableIds],
    queryFn: () =>
      isMockBackend
        ? Promise.resolve(mockArticles.filter((a) => ids.includes(a.id)))
        : fetchArticlesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSavedArticlesList() {
  return useQuery({
    queryKey: ["articles", "saved"],
    queryFn: () => fetchAllArticles({ savedOnly: true }),
    enabled: !isMockBackend,
    staleTime: 5 * 60 * 1000,
  });
}

export type { Article };
