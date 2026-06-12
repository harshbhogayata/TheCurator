import type { Article } from "../data/articles";
import type { BriefItem } from "../data/briefs";
import {
  filterMockArticles,
  findMockArticle,
  mockBriefs,
  mockCategories,
} from "../data/mock-content";
import type { Collection, SessionPayload, SubscriptionTier, UserPreferences } from "../lib/types";
import { mockBackendEnabled } from "../lib/dev-flags";
import { apiRequest } from "./api-client";
import * as crypto from "expo-crypto";

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

export interface DevicePayload {
  id: string;
  deviceId?: string;
  expoPushToken: string;
  platform: "ios" | "android" | "web";
  appVersion: string;
  lastSeen: string;
}

export interface FeedbackPayload {
  id: string;
  createdAt: string;
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

export interface EntitlementPayload {
  tier: SubscriptionTier;
  effectiveTier: SubscriptionTier;
  qaOverrideEnabled: boolean;
  qaOverrideTier: "" | SubscriptionTier;
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
  if (mockBackendEnabled) {
    return filterMockArticles(filters);
  }

  const payload = await apiRequest<CursorListResponse<Article> | Article[]>(
    `${API_PREFIX}/articles${toQueryString({ limit: 50, ...filters })}`,
  );
  return Array.isArray(payload) ? payload : payload.items;
}

async function fetchArticlePage(filters?: Record<string, unknown>): Promise<CursorListResponse<Article>> {
  if (mockBackendEnabled) {
    return { items: filterMockArticles(filters), nextCursor: null };
  }

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
  if (mockBackendEnabled) {
    const article = findMockArticle(articleId);
    if (!article) {
      throw new Error("Article not found.");
    }
    return article;
  }

  return apiRequest<Article>(`${API_PREFIX}/articles/${articleId}`);
}

export async function fetchArticleAudio(articleId: string): Promise<ArticleAudioPayload> {
  return apiRequest<ArticleAudioPayload>(`${API_PREFIX}/articles/${articleId}/audio`);
}

export async function fetchBriefs(): Promise<BriefItem[]> {
  if (mockBackendEnabled) {
    return mockBriefs;
  }

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
  return apiRequest<Collection>(
    `${API_PREFIX}/collections/${collectionId}/articles/${articleId}`,
    {
      method: "DELETE",
    },
  );
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
  if (mockBackendEnabled) {
    return mockCategories;
  }

  const payload = await apiRequest<CategoryListResponse>(`${API_PREFIX}/categories`);
  return payload.items;
}

export async function fetchPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>(`${API_PREFIX}/preferences`);
}

export async function updatePreferences(
  input: Partial<UserPreferences>,
): Promise<UserPreferences> {
  return apiRequest<UserPreferences>(`${API_PREFIX}/preferences`, {
    method: "PATCH",
    body: input,
  });
}

export async function updateAccount(input: {
  displayName?: string;
  avatarUrl?: string;
}): Promise<SessionPayload> {
  return apiRequest<SessionPayload>(`${API_PREFIX}/account`, {
    method: "PATCH",
    body: input,
  });
}

export async function registerDevice(input: {
  expoPushToken: string;
  platform: "ios" | "android" | "web";
  appVersion?: string;
  deviceId?: string;
}): Promise<DevicePayload> {
  return apiRequest<DevicePayload>(`${API_PREFIX}/devices`, {
    method: "POST",
    headers: withIdempotencyHeader(),
    body: input,
  });
}

export async function unregisterDevice(deviceId: string): Promise<void> {
  await apiRequest<void>(`${API_PREFIX}/devices/${deviceId}`, {
    method: "DELETE",
  });
}

export async function submitFeedback(input: {
  category: "bug" | "idea" | "other";
  message: string;
  appVersion?: string;
  osVersion?: string;
  attachDiagnostics?: boolean;
}): Promise<FeedbackPayload> {
  return apiRequest<FeedbackPayload>(`${API_PREFIX}/feedback`, {
    method: "POST",
    headers: withIdempotencyHeader(),
    body: input,
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

export async function fetchEntitlement(): Promise<EntitlementPayload> {
  return apiRequest<EntitlementPayload>(`${API_PREFIX}/entitlements`);
}

export async function deleteAccountRemote(): Promise<void> {
  await apiRequest<void>(`${API_PREFIX}/account`, {
    method: "DELETE",
  });
}
