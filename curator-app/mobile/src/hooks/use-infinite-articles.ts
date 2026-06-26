import { useInfiniteQuery } from "@tanstack/react-query";

import type { Article } from "../data/articles";
import { queryKeys } from "../lib/query-keys";
import {
  fetchArticlePage,
  type CursorListResponse,
} from "../services/mobile-api";

export function flattenArticlePages(
  data: { pages: CursorListResponse<Article>[] } | undefined,
): Article[] {
  if (!data) return [];
  return data.pages.flatMap((page) => page.items);
}

export function useInfiniteArticles(
  filters?: Record<string, unknown>,
  options?: { enabled?: boolean },
) {
  return useInfiniteQuery({
    queryKey: queryKeys.articles.infinite(filters),
    queryFn: ({ pageParam }) =>
      fetchArticlePage({
        ...filters,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
