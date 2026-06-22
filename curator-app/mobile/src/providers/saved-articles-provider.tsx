import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Alert } from "react-native";
import {
  clearSavedArticlesRemote,
  listSavedArticleIds,
  saveArticleById,
  unsaveArticleById,
} from "../services/mobile-api";
import { invalidateSavedArticlesQueries } from "../lib/query-client";
import { notifyReadingStatsRefresh } from "../lib/stats-sync";
import { useAuth } from "./auth-provider";
import { useSubscription } from "./subscription-provider";

interface SavedArticlesContextValue {
  savedArticleIds: string[];
  saveArticle: (id: string) => void;
  unsaveArticle: (id: string) => void;
  isArticleSaved: (id: string) => boolean;
  savedCount: number;
  clearAllSaved: () => void;
}

const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";
const STORAGE_KEY = "curator.saved-articles";

const SavedArticlesContext = createContext<SavedArticlesContextValue | null>(null);

export function SavedArticlesProvider({ children }: PropsWithChildren) {
  const { status } = useAuth();
  const { hasUnlimitedSaves, maxSaves } = useSubscription();
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);

  useEffect(() => {
    if (MOCK_BACKEND) {
      let cancelled = false;
      AsyncStorage.getItem(STORAGE_KEY).then((value) => {
        if (!cancelled && value) {
          try {
            setSavedArticleIds(JSON.parse(value));
          } catch {
            setSavedArticleIds([]);
          }
        }
      });

      return () => {
        cancelled = true;
      };
    }

    if (status !== "signed-in") {
      setSavedArticleIds([]);
      return;
    }

    if (!MOCK_BACKEND) {
      void AsyncStorage.removeItem(STORAGE_KEY);
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
  }, [status]);

  const saveArticle = useCallback(
    (id: string) => {
      if (savedArticleIds.includes(id)) {
        return;
      }

      if (!hasUnlimitedSaves && savedArticleIds.length >= maxSaves) {
        Alert.alert(
          "Limit Reached",
          `You've reached the limit of ${maxSaves} saved articles on your current tier. Upgrade to save more!`,
          [{ text: "OK" }]
        );
        return;
      }

      if (!MOCK_BACKEND && status !== "signed-in") {
        return;
      }

      setSavedArticleIds((prev) => {
        const next = [...prev, id];
        if (MOCK_BACKEND) {
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });

      if (MOCK_BACKEND || status !== "signed-in") {
        return;
      }

      void saveArticleById(id)
        .then((ids) => {
          setSavedArticleIds(ids);
          invalidateSavedArticlesQueries();
          notifyReadingStatsRefresh();
        })
        .catch(() => {
          setSavedArticleIds((prev) => prev.filter((articleId) => articleId !== id));
        });
    },
    [status, savedArticleIds, hasUnlimitedSaves, maxSaves],
  );

  const unsaveArticle = useCallback(
    (id: string) => {
      if (!MOCK_BACKEND && status !== "signed-in") {
        return;
      }

      setSavedArticleIds((prev) => {
        const next = prev.filter((articleId) => articleId !== id);
        if (MOCK_BACKEND) {
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });

      if (MOCK_BACKEND || status !== "signed-in") {
        return;
      }

      void unsaveArticleById(id)
        .then((ids) => {
          setSavedArticleIds(ids);
          invalidateSavedArticlesQueries();
          notifyReadingStatsRefresh();
        })
        .catch(() => {
          setSavedArticleIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        });
    },
    [status],
  );

  const isArticleSaved = useCallback(
    (id: string) => savedArticleIds.includes(id),
    [savedArticleIds],
  );

  const clearAllSaved = useCallback(() => {
    setSavedArticleIds([]);

    if (MOCK_BACKEND) {
      void AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (status !== "signed-in") {
      return;
    }

    void clearSavedArticlesRemote()
      .then((ids) => {
        setSavedArticleIds(ids);
        invalidateSavedArticlesQueries();
        notifyReadingStatsRefresh();
      });
  }, [status]);

  const value = useMemo<SavedArticlesContextValue>(
    () => ({
      savedArticleIds,
      saveArticle,
      unsaveArticle,
      isArticleSaved,
      savedCount: savedArticleIds.length,
      clearAllSaved,
    }),
    [savedArticleIds, saveArticle, unsaveArticle, isArticleSaved, clearAllSaved],
  );

  return (
    <SavedArticlesContext.Provider value={value}>
      {children}
    </SavedArticlesContext.Provider>
  );
}

export function useSavedArticles(): SavedArticlesContextValue {
  const context = useContext(SavedArticlesContext);
  if (!context) {
    throw new Error("useSavedArticles must be used within a SavedArticlesProvider");
  }
  return context;
}
