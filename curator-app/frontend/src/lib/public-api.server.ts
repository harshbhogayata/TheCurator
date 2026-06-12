/**
 * Server-side data access for the public (unauthenticated) Curator API.
 * Used by SSR loaders and SEO resource routes only.
 */

import type {
  PublicArticle,
  PublicBrief,
  PublicCategory,
  SitemapEntry,
} from "./site";

const API_BASE =
  process.env.API_URL ||
  process.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (response.status === 404) {
    throw new Response("Not Found", { status: 404 });
  }
  if (!response.ok) {
    throw new Response("Upstream error", { status: 502 });
  }
  return response.json() as Promise<T>;
}

export function fetchPublicArticles(params: {
  category?: string;
  cursor?: string;
  limit?: number;
  q?: string;
} = {}): Promise<Paginated<PublicArticle>> {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return getJson(`/api/public/v1/articles${qs ? `?${qs}` : ""}`);
}

export function fetchPublicArticle(slug: string): Promise<PublicArticle> {
  return getJson(`/api/public/v1/articles/${encodeURIComponent(slug)}`);
}

export function fetchPublicBriefs(limit = 20): Promise<Paginated<PublicBrief>> {
  return getJson(`/api/public/v1/briefs?limit=${limit}`);
}

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
  const payload = await getJson<{ items: PublicCategory[] }>("/api/public/v1/categories");
  return payload.items;
}

export async function fetchSitemapEntries(): Promise<SitemapEntry[]> {
  const payload = await getJson<{ items: SitemapEntry[] }>("/api/public/v1/sitemap-data");
  return payload.items;
}
