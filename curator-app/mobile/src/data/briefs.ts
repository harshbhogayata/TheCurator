import { IMAGES } from './images';

export interface BriefItem {
  id: string;
  title: string;
  summary: string;
  duration: string;
  durationMs: number;
  publishedDate: string;
  imageUrl: string;
  audioUrl: string;
  category: string;
  insights: number;
}

export const dailyBriefs: BriefItem[] = [
  {
    id: '1',
    title: 'Your morning distillation: 8 vital insights for Wednesday',
    summary: 'A curated overview of the most important developments across markets, technology, and global policy to start your day informed.',
    duration: '12 min',
    durationMs: 720000,
    publishedDate: 'Today',
    category: 'Daily Brief',
    imageUrl: IMAGES.editorial.brief,
    insights: 8,
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
  },
  {
    id: '2',
    title: 'Technology Week in Review: AI governance and quantum breakthroughs',
    summary: 'This week saw major shifts in AI regulation frameworks alongside surprising advances in quantum error correction from three independent labs.',
    duration: '15 min',
    durationMs: 900000,
    publishedDate: 'Yesterday',
    category: 'Weekly Tech',
    imageUrl: IMAGES.briefs.tech,
    insights: 12,
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther30.wav',
  },
  {
    id: '3',
    title: 'Climate Action Digest: Policy shifts across three continents',
    summary: 'New carbon border adjustments in the EU, revised emissions targets in Southeast Asia, and a landmark court ruling in South America reshape the climate landscape.',
    duration: '10 min',
    durationMs: 600000,
    publishedDate: '2 days ago',
    category: 'Climate Focus',
    imageUrl: IMAGES.briefs.climate,
    insights: 6,
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav',
  },
  {
    id: '4',
    title: 'Economic Indicators: Markets respond to central bank signals',
    summary: 'Central banks across major economies sent mixed signals this week, with bond markets reacting sharply to unexpected policy language changes.',
    duration: '8 min',
    durationMs: 480000,
    publishedDate: '3 days ago',
    category: 'Markets',
    imageUrl: IMAGES.briefs.markets,
    insights: 5,
    audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav',
  },
];
