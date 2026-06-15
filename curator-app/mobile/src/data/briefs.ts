export interface BriefItem {
  id: string;
  title: string;
  summary: string;
  duration: string;
  durationMinutes: number;
  durationMs: number;
  publishedDate: string;
  publishedAt?: string;
  imageUrl: string;
  imageAttribution?: string;
  audioUrl: string;
  hasAudioAvailable?: boolean;
  category: string;
  insights: number;
  isBreaking: boolean;
}
