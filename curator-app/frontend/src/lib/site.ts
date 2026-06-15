/** Shared (client-safe) site constants and public content types. */

const fromProcess =
  typeof process !== "undefined" ? process.env?.SITE_URL : undefined;

export const SITE_URL = (
  fromProcess ||
  import.meta.env.VITE_SITE_URL ||
  "https://thecuratorgroup.org"
).replace(/\/$/, "");

/** Edge/CDN cache policy for anonymous public pages (SSR list pages). */
export const PUBLIC_CACHE_CONTROL =
  "public, max-age=300, s-maxage=600, stale-while-revalidate=86400";

export interface PublicCategory {
  slug: string;
  name: string;
  color: string;
  icon: string;
  rank: number;
}

export interface PublicArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  readTimeMinutes: number;
  publishedDate: string;
  publishedAt: string;
  author: string;
  sources: string[];
  sourceLinks?: { name: string; url: string }[];
  topics?: string[];
  imageQuery: string;
  imageUrl: string;
  imageSourceUrl: string;
  imageAttribution: string;
  content?: string;
  audioDurationSec: number | null;
}

export interface PublicBrief {
  id: string;
  title: string;
  summary: string;
  duration: string;
  durationMinutes: number;
  publishedDate: string;
  publishedAt: string;
  imageUrl: string;
  category: string;
  insights: number;
  isBreaking: boolean;
}

export interface SitemapEntry {
  slug: string;
  title: string;
  publishedAt: string;
  updatedAt: string;
}
