import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import type { Article } from "../../data/articles";
import {
  listSavedArticleIds,
  saveArticleById,
  unsaveArticleById,
  clearSavedArticlesRemote,
} from "../../services/mobile-api";
import { useAuth } from "./AuthContext";
import { useSubscription } from "./SubscriptionContext";
import { isMockBackend } from "../../lib/dev-mode";

interface SavedArticlesContextType {
  savedArticles: Article[];
  savedArticleIds: string[];
  saveArticle: (article: Article) => boolean;
  unsaveArticle: (articleId: string) => void;
  isArticleSaved: (articleId: string) => boolean;
  savedCount: number;
  clearAllSaved: () => void;
}

const MOCK_BACKEND = isMockBackend;
const STORAGE_KEY = "curator.saved-articles";

const SavedArticlesContext = createContext<SavedArticlesContextType | undefined>(undefined);

export function SavedArticlesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { hasUnlimitedSaves, maxSaves } = useSubscription();
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (MOCK_BACKEND) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Article[];
          setSavedArticles(parsed);
          setSavedArticleIds(parsed.map((a) => a.id));
        } catch {
          setSavedArticles([]);
          setSavedArticleIds([]);
        }
      }
      return;
    }

    if (!isAuthenticated) {
      setSavedArticleIds([]);
      setSavedArticles([]);
      return;
    }

    let cancelled = false;
    listSavedArticleIds()
      .then((ids) => {
        if (!cancelled) {
          setSavedArticleIds(ids);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedArticleIds([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (MOCK_BACKEND) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedArticles));
    }
  }, [savedArticles]);

  const saveArticle = useCallback(
    (article: Article): boolean => {
      if (savedArticleIds.includes(article.id)) {
        return false;
      }

      if (!hasUnlimitedSaves && savedArticleIds.length >= maxSaves) {
        return false;
      }

      setSavedArticleIds((prev) => [...prev, article.id]);
      setSavedArticles((prev) => [...prev, article]);

      if (!MOCK_BACKEND && isAuthenticated) {
        void saveArticleById(article.id).catch(() => {
          setSavedArticleIds((prev) => prev.filter((id) => id !== article.id));
          setSavedArticles((prev) => prev.filter((a) => a.id !== article.id));
        });
      }

      return true;
    },
    [savedArticleIds, hasUnlimitedSaves, maxSaves, isAuthenticated],
  );

  const unsaveArticle = useCallback(
    (articleId: string) => {
      setSavedArticleIds((prev) => prev.filter((id) => id !== articleId));
      setSavedArticles((prev) => prev.filter((a) => a.id !== articleId));

      if (!MOCK_BACKEND && isAuthenticated) {
        void unsaveArticleById(articleId).catch(() => {
          void listSavedArticleIds().then(setSavedArticleIds);
        });
      }
    },
    [isAuthenticated],
  );

  const isArticleSaved = useCallback(
    (articleId: string) => savedArticleIds.includes(articleId),
    [savedArticleIds],
  );

  const clearAllSaved = useCallback(() => {
    setSavedArticleIds([]);
    setSavedArticles([]);
    if (!MOCK_BACKEND && isAuthenticated) {
      void clearSavedArticlesRemote();
    }
  }, [isAuthenticated]);

  return (
    <SavedArticlesContext.Provider
      value={{
        savedArticles,
        savedArticleIds,
        saveArticle,
        unsaveArticle,
        isArticleSaved,
        savedCount: savedArticleIds.length,
        clearAllSaved,
      }}
    >
      {children}
    </SavedArticlesContext.Provider>
  );
}

export function useSavedArticles() {
  const context = useContext(SavedArticlesContext);
  if (context === undefined) {
    throw new Error("useSavedArticles must be used within a SavedArticlesProvider");
  }
  return context;
}
