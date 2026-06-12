import type { Article } from "./articles";
import type { BriefItem } from "./briefs";

const SAMPLE_AUDIO = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

const seedArticles: Article[] = [
  {
    id: "mock-1",
    title: "The Quiet Resurgence of Volatility in Emerging Markets",
    excerpt:
      "A synthesized analysis of global equity shifts, tracking currency devaluation and institutional capital flight across the Pacific Rim.",
    category: "economy",
    readTime: "6 min read",
    readTimeMinutes: 6,
    imageQuery: "modern architecture shadows geometric",
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    sources: ["NY", "FT", "WS", "EC"],
    author: "The Curator Editorial Team",
    publishedDate: "March 23, 2026",
    content: "As global markets recalibrate, emerging economies face selective volatility across sectors and regions.",
    audioUrl: SAMPLE_AUDIO,
    audioDurationSec: 372,
  },
  {
    id: "mock-2",
    title: "Beyond Silicon: The Biological Compute Revolution",
    excerpt:
      "Major labs report breakthrough success in organic data storage, suggesting infrastructure that grows rather than being manufactured.",
    category: "technology",
    readTime: "12 min read",
    readTimeMinutes: 12,
    imageQuery: "futuristic circuit board technology dark",
    imageUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    sources: ["TC", "VG", "WI"],
    author: "The Curator Science Desk",
    publishedDate: "March 22, 2026",
    content: "Biological computing is moving from speculative labs toward practical prototypes with major density gains.",
    audioUrl: SAMPLE_AUDIO,
    audioDurationSec: 720,
  },
  {
    id: "mock-3",
    title: "The New Climate Diplomacy: Carbon Borders and Trade Wars",
    excerpt:
      "As carbon border adjustments take effect, developing nations challenge the framework for climate responsibility.",
    category: "climate",
    readTime: "8 min read",
    readTimeMinutes: 8,
    imageQuery: "climate environment nature earth",
    imageUrl:
      "https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?auto=format&fit=crop&w=1200&q=80",
    sources: ["UN", "FT", "EC"],
    author: "The Curator International Desk",
    publishedDate: "March 21, 2026",
    content: "Carbon border policy is now a first-order trade variable reshaping diplomatic strategy.",
    audioUrl: SAMPLE_AUDIO,
    audioDurationSec: 480,
  },
  {
    id: "mock-4",
    title: "Renaissance of Regional Cuisine: How Food Is Defining Cultural Identity",
    excerpt:
      "Chefs and communities reclaim traditional foodways as expressions of cultural sovereignty and environmental stewardship.",
    category: "culture",
    readTime: "7 min read",
    readTimeMinutes: 7,
    imageQuery: "culture art museum gallery",
    imageUrl:
      "https://images.unsplash.com/photo-1466637574441-749b8f194175?auto=format&fit=crop&w=1200&q=80",
    sources: ["GR", "SA", "FT"],
    author: "The Curator Culture Desk",
    publishedDate: "March 20, 2026",
    content: "Regional cuisine is re-emerging as a marker of identity in an era of globalized food systems.",
    audioUrl: SAMPLE_AUDIO,
    audioDurationSec: 420,
  },
  {
    id: "mock-5",
    title: "The Longevity Equation: New Research Challenges Aging Assumptions",
    excerpt:
      "Longitudinal studies across five continents suggest our understanding of healthy aging may need revision.",
    category: "health",
    readTime: "9 min read",
    readTimeMinutes: 9,
    imageQuery: "health wellness medicine medical",
    imageUrl:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
    sources: ["LN", "NM", "SC"],
    author: "The Curator Health Desk",
    publishedDate: "March 19, 2026",
    content: "New cohort studies are challenging assumptions about diet, exercise, and healthy aging.",
    audioUrl: SAMPLE_AUDIO,
    audioDurationSec: 540,
  },
  {
    id: "mock-6",
    title: "Decentralized Governance: Digital Democracy Experiments Yield Surprising Results",
    excerpt:
      "Early adopters of blockchain-based voting systems report higher engagement, but equity questions remain.",
    category: "politics",
    readTime: "10 min read",
    readTimeMinutes: 10,
    imageQuery: "politics government capitol building",
    imageUrl:
      "https://images.unsplash.com/photo-1541872703-74c5ccc2710?auto=format&fit=crop&w=1200&q=80",
    sources: ["PT", "EC", "WI"],
    author: "The Curator Politics Desk",
    publishedDate: "March 18, 2026",
    content: "Digital democracy pilots are showing higher engagement but uneven access across communities.",
    audioUrl: SAMPLE_AUDIO,
    audioDurationSec: 600,
  },
];

export const mockArticles: Article[] = seedArticles;

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

export const mockCategories = [
  { slug: "economy", name: "Economy", color: "#6B7280", icon: "trending-up", rank: 1 },
  { slug: "technology", name: "Technology", color: "#3B82F6", icon: "cpu", rank: 2 },
  { slug: "science", name: "Science", color: "#8B5CF6", icon: "flask", rank: 3 },
  { slug: "culture", name: "Culture", color: "#EC4899", icon: "palette", rank: 4 },
  { slug: "health", name: "Health", color: "#10B981", icon: "heart", rank: 5 },
  { slug: "politics", name: "Politics", color: "#F59E0B", icon: "landmark", rank: 6 },
  { slug: "climate", name: "Climate", color: "#22C55E", icon: "leaf", rank: 7 },
];

export function findMockArticle(id: string): Article | null {
  return mockArticles.find((article) => article.id === id) ?? null;
}

export function filterMockArticles(filters?: Record<string, unknown>): Article[] {
  let items = [...mockArticles];
  const category = filters?.category;
  const search = filters?.search ?? filters?.q;
  const ids = filters?.ids;

  if (typeof ids === "string" && ids.trim()) {
    const requested = ids.split(",").map((value) => value.trim());
    return requested
      .map((id) => items.find((article) => article.id === id))
      .filter((article): article is Article => Boolean(article));
  }

  if (typeof category === "string" && category.trim() && category !== "all") {
    const normalized = category.trim().toLowerCase();
    items = items.filter((article) => article.category.toLowerCase() === normalized);
  }

  if (typeof search === "string" && search.trim()) {
    const query = search.trim().toLowerCase();
    items = items.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query),
    );
  }

  if (filters?.savedOnly) {
    return [];
  }

  return items;
}
