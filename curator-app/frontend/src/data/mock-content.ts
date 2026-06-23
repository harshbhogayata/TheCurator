import type { Article } from "./articles";
import type { BriefItem } from "./briefs";
import { articles as seedArticles } from "../app/data/articles";
import type { CategoryItem } from "../hooks/use-categories";

const SAMPLE_AUDIO =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export const mockArticles: Article[] = seedArticles.map((article, index) => ({
  ...article,
  id: article.id.startsWith("mock-") ? article.id : `mock-${article.id}`,
  audioUrl: index < 3 ? SAMPLE_AUDIO : article.audioUrl,
  audioDurationSec: index < 3 ? 480 : article.audioDurationSec ?? null,
}));

export const mockBriefs: BriefItem[] = [
  {
    id: "mock-brief-1",
    title: "The World in Ten Minutes",
    summary:
      "Markets steady as climate policy shifts, biocompute breakthroughs, and regional trade realignments — distilled from twelve global desks.",
    duration: "8 min",
    durationMinutes: 8,
    durationMs: 480_000,
    publishedDate: "March 23, 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
    audioUrl: SAMPLE_AUDIO,
    category: "Economy",
    insights: 12,
    isBreaking: true,
  },
  {
    id: "mock-brief-2",
    title: "Technology & Power",
    summary:
      "Biological compute, AI regulation, and the next chip cycle — what the synthesis says about the week ahead.",
    duration: "6 min",
    durationMinutes: 6,
    durationMs: 360_000,
    publishedDate: "March 22, 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    audioUrl: SAMPLE_AUDIO,
    category: "Technology",
    insights: 10,
    isBreaking: false,
  },
  {
    id: "mock-brief-3",
    title: "Climate & Culture",
    summary:
      "Carbon borders, food sovereignty, and the diplomacy reshaping how nations trade responsibility for emissions.",
    duration: "7 min",
    durationMinutes: 7,
    durationMs: 420_000,
    publishedDate: "March 21, 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    audioUrl: SAMPLE_AUDIO,
    category: "Climate",
    insights: 9,
    isBreaking: false,
  },
];

export const mockCategories: CategoryItem[] = [
  { slug: "news", name: "World News", color: "#0369a1", icon: "newspaper", rank: 0 },
  { slug: "economy", name: "Economy", color: "#6B7280", icon: "trending-up", rank: 1 },
  { slug: "technology", name: "Technology", color: "#3B82F6", icon: "cpu", rank: 2 },
  { slug: "science", name: "Science", color: "#8B5CF6", icon: "flask", rank: 3 },
  { slug: "culture", name: "Culture", color: "#EC4899", icon: "palette", rank: 4 },
  { slug: "health", name: "Health", color: "#10B981", icon: "heart", rank: 5 },
  { slug: "politics", name: "Politics", color: "#F59E0B", icon: "landmark", rank: 6 },
  { slug: "climate", name: "Climate", color: "#22C55E", icon: "leaf", rank: 7 },
];

export function findMockArticle(id: string): Article | null {
  return mockArticles.find((a) => a.id === id) ?? null;
}

export function filterMockArticles(filters?: Record<string, unknown>): Article[] {
  let items = [...mockArticles];
  const category = filters?.category;
  const search = filters?.search ?? filters?.q;

  if (typeof category === "string" && category && category !== "All") {
    items = items.filter(
      (a) => a.category.toLowerCase() === category.toLowerCase(),
    );
  }

  if (typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    );
  }

  if (filters?.savedOnly) {
    return [];
  }

  return items;
}
