import type { Article } from "../data/articles";
import type { BriefItem } from "../data/briefs";
import type { Collection, SubscriptionTier, UserPreferences } from "../lib/types";
import { apiRequest } from "./api-client";
import { findMockArticle } from "../data/mock-content";
import { isMockBackend } from "../lib/dev-mode";

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

interface CursorListResponse<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

interface CategoryPayload {
  slug: string;
  name: string;
  color: string;
  icon: string;
  rank: number;
}

interface CategoryListResponse {
  items: CategoryPayload[];
}

export interface EntitlementPayload {
  tier: SubscriptionTier;
  effectiveTier: SubscriptionTier;
  qaOverrideEnabled: boolean;
  qaOverrideTier: "" | SubscriptionTier;
}

export interface PrivacyExportPayload {
  id: string;
  status: "pending" | "completed" | "failed";
  downloadUrl: string | null;
  createdAt: string;
}

interface PrivacyExportListResponse {
  items: PrivacyExportPayload[];
}

export interface ArticleAudioPayload {
  audioUrl: string;
  durationSec: number | null;
}

function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

function withIdempotencyHeader(headers?: Record<string, string>): Record<string, string> {
  return {
    ...(headers ?? {}),
    "Idempotency-Key": createIdempotencyKey(),
  };
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
  const payload = await apiRequest<CursorListResponse<Article> | Article[]>(
    `${API_PREFIX}/articles${toQueryString({ limit: 50, ...filters })}`,
  );
  return Array.isArray(payload) ? payload : payload.items;
}

async function fetchArticlePage(filters?: Record<string, unknown>): Promise<CursorListResponse<Article>> {
  const payload = await apiRequest<CursorListResponse<Article> | Article[]>(
    `${API_PREFIX}/articles${toQueryString({ limit: 50, ...filters })}`,
  );
  return Array.isArray(payload) ? { items: payload, nextCursor: null } : payload;
}

export async function fetchAllArticles(filters?: Record<string, unknown>): Promise<Article[]> {
  const allItems: Article[] = [];
  let cursor: string | null = null;

  do {
    const page = await fetchArticlePage({ ...filters, cursor: cursor ?? undefined });
    allItems.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);

  return allItems;
}

export async function fetchArticlesByIds(articleIds: string[]): Promise<Article[]> {
  if (articleIds.length === 0) {
    return [];
  }

  const uniqueIds = Array.from(new Set(articleIds));
  const chunks: string[][] = [];
  for (let index = 0; index < uniqueIds.length; index += 50) {
    chunks.push(uniqueIds.slice(index, index + 50));
  }

  const pages = await Promise.all(
    chunks.map((chunk) => fetchArticlePage({ ids: chunk.join(","), limit: chunk.length })),
  );
  const articlesById = new Map(pages.flatMap((page) => page.items).map((article) => [article.id, article]));
  return uniqueIds.map((id) => articlesById.get(id)).filter((article): article is Article => Boolean(article));
}

export async function fetchArticle(articleId: string): Promise<Article> {
  return apiRequest<Article>(`${API_PREFIX}/articles/${articleId}`);
}

export async function fetchArticleAudio(articleId: string): Promise<ArticleAudioPayload> {
  if (isMockBackend) {
    const article = findMockArticle(articleId);
    return {
      audioUrl:
        article?.audioUrl ??
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      durationSec: article?.audioDurationSec ?? 480,
    };
  }
  return apiRequest<ArticleAudioPayload>(`${API_PREFIX}/articles/${articleId}/audio`);
}

export async function fetchBriefs(): Promise<BriefItem[]> {
  const payload = await apiRequest<CursorListResponse<BriefItem> | BriefItem[]>(
    `${API_PREFIX}/briefs${toQueryString({ limit: 50 })}`,
  );
  return Array.isArray(payload) ? payload : payload.items;
}

export async function listSavedArticleIds(): Promise<string[]> {
  const payload = await apiRequest<SavedArticleIdsResponse>(`${API_PREFIX}/saves`);
  return payload.articleIds;
}

export async function saveArticleById(articleId: string): Promise<string[]> {
  const payload = await apiRequest<SavedArticleIdsResponse>(`${API_PREFIX}/saves`, {
    method: "POST",
    headers: withIdempotencyHeader(),
    body: { articleId },
  });
  return payload.articleIds;
}

export async function unsaveArticleById(articleId: string): Promise<string[]> {
  const payload = await apiRequest<SavedArticleIdsResponse>(`${API_PREFIX}/saves/${articleId}`, {
    method: "DELETE",
  });
  return payload.articleIds;
}

export async function clearSavedArticlesRemote(): Promise<string[]> {
  const payload = await apiRequest<SavedArticleIdsResponse>(`${API_PREFIX}/saves?clearAll=true`, {
    method: "DELETE",
  });
  return payload.articleIds;
}

export async function listCollections(): Promise<Collection[]> {
  const payload = await apiRequest<CollectionsResponse>(`${API_PREFIX}/collections`);
  return payload.collections;
}

export async function createCollectionRemote(input: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<Collection> {
  return apiRequest<Collection>(`${API_PREFIX}/collections`, {
    method: "POST",
    headers: withIdempotencyHeader(),
    body: input,
  });
}

export async function updateCollectionRemote(
  collectionId: string,
  input: Partial<Pick<Collection, "name" | "description" | "color" | "icon">>,
): Promise<Collection> {
  return apiRequest<Collection>(`${API_PREFIX}/collections/${collectionId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteCollectionRemote(collectionId: string): Promise<void> {
  await apiRequest<void>(`${API_PREFIX}/collections/${collectionId}`, {
    method: "DELETE",
  });
}

export async function addArticleToCollectionRemote(
  collectionId: string,
  articleId: string,
): Promise<Collection> {
  return apiRequest<Collection>(`${API_PREFIX}/collections/${collectionId}/articles`, {
    method: "POST",
    headers: withIdempotencyHeader(),
    body: { articleId },
  });
}

export async function removeArticleFromCollectionRemote(
  collectionId: string,
  articleId: string,
): Promise<Collection> {
  return apiRequest<Collection>(`${API_PREFIX}/collections/${collectionId}/articles/${articleId}`, {
    method: "DELETE",
  });
}

export async function fetchReadingStats(): Promise<ReadingStatsPayload> {
  return apiRequest<ReadingStatsPayload>(`${API_PREFIX}/reading/stats`);
}

export async function recordReadingEvent(input: {
  articleId?: string;
  readTimeMs: number;
}): Promise<ReadingStatsPayload> {
  return apiRequest<ReadingStatsPayload>(`${API_PREFIX}/reading/events`, {
    method: "POST",
    headers: withIdempotencyHeader(),
    body: input,
  });
}

export async function fetchCategories(): Promise<CategoryPayload[]> {
  const payload = await apiRequest<CategoryListResponse>(`${API_PREFIX}/categories`);
  return payload.items;
}

export async function fetchPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>(`${API_PREFIX}/preferences`);
}

export async function updatePreferences(input: Partial<UserPreferences>): Promise<UserPreferences> {
  return apiRequest<UserPreferences>(`${API_PREFIX}/preferences`, {
    method: "PATCH",
    body: input,
  });
}

export async function fetchEntitlement(): Promise<EntitlementPayload> {
  return apiRequest<EntitlementPayload>(`${API_PREFIX}/entitlements`);
}

export interface DevicePayload {
  deviceId: string;
  expoPushToken: string;
  platform: "ios" | "android" | "web";
  appVersion: string;
  lastSeen: string;
}

export async function registerWebPushDevice(
  subscription: PushSubscriptionJSON,
): Promise<DevicePayload> {
  return apiRequest<DevicePayload>(`${API_PREFIX}/devices`, {
    method: "POST",
    headers: withIdempotencyHeader(),
    body: { platform: "web", webPushSubscription: subscription },
  });
}

export async function deactivateDevice(deviceId: string): Promise<void> {
  await apiRequest<void>(`${API_PREFIX}/devices/${deviceId}`, {
    method: "DELETE",
  });
}

const BILLING_PREFIX = "/api/billing/v1";

export async function createStripeCheckout(
  tier: Exclude<SubscriptionTier, "free">,
): Promise<{ url: string }> {
  return apiRequest<{ url: string }>(`${BILLING_PREFIX}/checkout/`, {
    method: "POST",
    body: { tier },
  });
}

export async function createStripePortal(): Promise<{ url: string }> {
  return apiRequest<{ url: string }>(`${BILLING_PREFIX}/portal/`, {
    method: "POST",
  });
}

export async function updateAccountRemote(input: {
  displayName?: string;
  avatarUrl?: string;
}): Promise<{ displayName: string | null; avatarUrl: string | null }> {
  return apiRequest<{ displayName: string | null; avatarUrl: string | null }>(
    `${API_PREFIX}/account`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export async function deleteAccountRemote(): Promise<void> {
  await apiRequest<void>(`${API_PREFIX}/account`, {
    method: "DELETE",
  });
}

export async function requestPrivacyExport(): Promise<PrivacyExportPayload> {
  return apiRequest<PrivacyExportPayload>(`${API_PREFIX}/privacy/export`, {
    method: "POST",
    headers: withIdempotencyHeader(),
  });
}

export async function listPrivacyExports(): Promise<PrivacyExportPayload[]> {
  const payload = await apiRequest<PrivacyExportListResponse>(`${API_PREFIX}/privacy/exports`);
  return payload.items;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type { AuthedApiRequestOptions };
