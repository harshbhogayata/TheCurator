import type { Article } from "../data/articles";
import type { BriefItem } from "../data/briefs";
import type { Collection, SubscriptionTier } from "../lib/types";
import { apiRequest } from "./api-client";
import { getFirebaseAuth } from "./firebase";

const API_PREFIX = "/api/mobile/v1";

interface AuthedApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export interface ReadingStatsPayload {
  totalArticlesRead: number;
  totalReadTimeMs: number;
  totalSaved: number;
  currentStreak: number;
  longestStreak: number;
  dailyHistory: Array<{
    date: string;
    articlesRead: number;
    readTimeMs: number;
  }>;
  recentArticleIds: string[];
}

interface SavedArticleIdsResponse {
  articleIds: string[];
}

interface CollectionsResponse {
  collections: Collection[];
}

export interface EntitlementPayload {
  tier: SubscriptionTier;
  effectiveTier: SubscriptionTier;
  qa_override_enabled: boolean;
  qa_override_tier: "" | SubscriptionTier;
}

async function getIdToken(): Promise<string> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You need to be signed in to continue.");
  }

  return user.getIdToken();
}

async function authedRequest<T>(
  path: string,
  options: AuthedApiRequestOptions = {},
): Promise<T> {
  const token = await getIdToken();
  return apiRequest<T>(path, { ...options, token });
}

function toQueryString(filters?: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value === undefined || value === null) {
      continue;
    }

    const asString = String(value).trim();
    if (!asString) {
      continue;
    }

    params.set(key, asString);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchArticles(filters?: Record<string, unknown>): Promise<Article[]> {
  return authedRequest<Article[]>(`${API_PREFIX}/articles${toQueryString(filters)}`);
}

export async function fetchArticle(articleId: string): Promise<Article> {
  return authedRequest<Article>(`${API_PREFIX}/articles/${articleId}`);
}

export async function fetchBriefs(): Promise<BriefItem[]> {
  return authedRequest<BriefItem[]>(`${API_PREFIX}/briefs`);
}

export async function listSavedArticleIds(): Promise<string[]> {
  const payload = await authedRequest<SavedArticleIdsResponse>(`${API_PREFIX}/saves`);
  return payload.articleIds;
}

export async function saveArticleById(articleId: string): Promise<string[]> {
  const payload = await authedRequest<SavedArticleIdsResponse>(`${API_PREFIX}/saves`, {
    method: "POST",
    body: { articleId },
  });
  return payload.articleIds;
}

export async function unsaveArticleById(articleId: string): Promise<string[]> {
  const payload = await authedRequest<SavedArticleIdsResponse>(`${API_PREFIX}/saves/${articleId}`, {
    method: "DELETE",
  });
  return payload.articleIds;
}

export async function clearSavedArticlesRemote(): Promise<string[]> {
  const payload = await authedRequest<SavedArticleIdsResponse>(`${API_PREFIX}/saves`, {
    method: "DELETE",
  });
  return payload.articleIds;
}

export async function listCollections(): Promise<Collection[]> {
  const payload = await authedRequest<CollectionsResponse>(`${API_PREFIX}/collections`);
  return payload.collections;
}

export async function createCollectionRemote(input: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<Collection> {
  return authedRequest<Collection>(`${API_PREFIX}/collections`, {
    method: "POST",
    body: input,
  });
}

export async function updateCollectionRemote(
  collectionId: string,
  input: Partial<Pick<Collection, "name" | "description" | "color" | "icon">>,
): Promise<Collection> {
  return authedRequest<Collection>(`${API_PREFIX}/collections/${collectionId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteCollectionRemote(collectionId: string): Promise<void> {
  await authedRequest<void>(`${API_PREFIX}/collections/${collectionId}`, {
    method: "DELETE",
  });
}

export async function addArticleToCollectionRemote(
  collectionId: string,
  articleId: string,
): Promise<Collection> {
  return authedRequest<Collection>(`${API_PREFIX}/collections/${collectionId}/articles`, {
    method: "POST",
    body: { articleId },
  });
}

export async function removeArticleFromCollectionRemote(
  collectionId: string,
  articleId: string,
): Promise<Collection> {
  return authedRequest<Collection>(
    `${API_PREFIX}/collections/${collectionId}/articles/${articleId}`,
    {
      method: "DELETE",
    },
  );
}

export async function fetchReadingStats(): Promise<ReadingStatsPayload> {
  return authedRequest<ReadingStatsPayload>(`${API_PREFIX}/reading/stats`);
}

export async function recordReadingEvent(input: {
  articleId?: string;
  readTimeMs: number;
}): Promise<ReadingStatsPayload> {
  return authedRequest<ReadingStatsPayload>(`${API_PREFIX}/reading/events`, {
    method: "POST",
    body: input,
  });
}

export async function fetchEntitlement(): Promise<EntitlementPayload> {
  return authedRequest<EntitlementPayload>(`${API_PREFIX}/entitlements`);
}

export async function updateEntitlementTier(
  tier: SubscriptionTier,
): Promise<EntitlementPayload> {
  return authedRequest<EntitlementPayload>(`${API_PREFIX}/entitlements`, {
    method: "PATCH",
    body: { tier },
  });
}

export async function deleteAccountRemote(): Promise<void> {
  await authedRequest<void>("/api/mobile/account", {
    method: "DELETE",
  });
}
