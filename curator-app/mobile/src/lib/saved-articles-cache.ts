import type { Article } from "../data/articles";
import { queryClient } from "./query-client";
import { queryKeys } from "./query-keys";
import { fetchArticlesByIds } from "../services/mobile-api";

let cacheGeneration = 0;

function byIdsQueryKey(ids: string[]) {
  return ["articles", "byIds", [...ids].sort().join(",")] as const;
}

function idsMatchCache(cached: Article[] | undefined, orderedIds: string[]): boolean {
  if (!cached || cached.length !== orderedIds.length) {
    return false;
  }
  const cachedIds = new Set(cached.map((article) => article.id));
  return orderedIds.every((id) => cachedIds.has(id));
}

export function clearSavedArticlesCaches(): void {
  cacheGeneration += 1;
  void queryClient.removeQueries({ queryKey: ["articles", "byIds"] });
}

export function primeSavedArticlesCache(orderedIds: string[]): void {
  if (orderedIds.length === 0) {
    return;
  }

  const generation = cacheGeneration;
  const key = byIdsQueryKey(orderedIds);
  const cached = queryClient.getQueryData<Article[]>(key);
  if (idsMatchCache(cached, orderedIds)) {
    return;
  }

  const fromDetails = orderedIds
    .map((id) => queryClient.getQueryData<Article>(queryKeys.articles.detail(id)))
    .filter((article): article is Article => Boolean(article));

  if (fromDetails.length > 0) {
    const byId = new Map(fromDetails.map((article) => [article.id, article]));
    const merged = orderedIds
      .map((id) => byId.get(id))
      .filter((article): article is Article => Boolean(article));
    if (merged.length > 0 && idsMatchCache(merged, orderedIds)) {
      queryClient.setQueryData(key, merged);
    }
  }

  void queryClient
    .fetchQuery({
      queryKey: key,
      queryFn: () => fetchArticlesByIds(orderedIds),
      staleTime: 5 * 60 * 1000,
    })
    .then((articles) => {
      if (generation !== cacheGeneration) {
        return;
      }
      if (idsMatchCache(articles, orderedIds)) {
        queryClient.setQueryData(key, articles);
      }
    });
}

export function dropArticleFromSavedCaches(articleId: string): void {
  queryClient.setQueriesData<Article[]>({ queryKey: ["articles", "byIds"] }, (current) => {
    if (!current) {
      return current;
    }
    const next = current.filter((article) => article.id !== articleId);
    return next.length === current.length ? current : next;
  });
}
