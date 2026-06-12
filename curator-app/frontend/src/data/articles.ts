export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  readTimeMinutes?: number;
  publishedDate: string;
  publishedAt?: string;
  author: string;
  sources: string[];
  imageQuery: string;
  imageUrl?: string;
  imageSourceUrl?: string;
  imageAttribution?: string;
  slug?: string;
  content?: string;
  audioUrl?: string;
  audioDurationSec?: number | null;
  relatedArticleIds?: string[];
}
