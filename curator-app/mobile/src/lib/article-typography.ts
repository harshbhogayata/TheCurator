import AsyncStorage from "@react-native-async-storage/async-storage";

import type { LineHeight, TextSize } from "./types";

export interface ArticleTypographyPreferences {
  fontSize: TextSize;
  lineHeight: LineHeight;
}

const storageKey = (articleId: string) => `curator.article.typography.${articleId}`;

export async function loadArticleTypography(
  articleId: string,
): Promise<ArticleTypographyPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(articleId));
    if (!raw) return null;
    return JSON.parse(raw) as ArticleTypographyPreferences;
  } catch {
    return null;
  }
}

export async function saveArticleTypography(
  articleId: string,
  prefs: ArticleTypographyPreferences,
): Promise<void> {
  await AsyncStorage.setItem(storageKey(articleId), JSON.stringify(prefs));
}

export const ARTICLE_FONT_SIZE_MAP: Record<TextSize, number> = {
  compact: 14,
  comfortable: 16,
  large: 18,
};

export const ARTICLE_LINE_HEIGHT_MAP: Record<LineHeight, number> = {
  compact: 1.4,
  comfortable: 1.6,
  spacious: 1.8,
};
