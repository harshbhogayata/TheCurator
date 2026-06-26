import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  clearSavedArticlesRemote,
  listSavedArticleIds,
  saveArticleById,
  unsaveArticleById,
} from "../services/mobile-api";
import { parseEntitlementError } from "../lib/parse-entitlement-error";
import {
  clearSavedArticlesCaches,
  dropArticleFromSavedCaches,
  primeSavedArticlesCache,
} from "../lib/saved-articles-cache";
import { invalidateSavedArticlesQueries } from "../lib/query-client";
import {
  createSaveMutationQueue,
  notifyArticlesUnsaved,
} from "../lib/saved-articles-sync";
import { notifyReadingStatsRefresh } from "../lib/stats-sync";
import { mockBackendEnabled } from "../lib/dev-flags";
import { useAuth } from "./auth-provider";
import { useSubscription } from "./subscription-provider";
import { useUpgradeGate } from "./upgrade-gate-provider";
import { useEmailVerificationGate } from "./email-verification-gate-provider";
import { useToast } from "./toast-provider";

interface SavedArticlesContextValue {
  savedArticleIds: string[];
  isHydrated: boolean;
  syncError: string | null;
  saveArticle: (id: string) => void;
  unsaveArticle: (id: string) => void;
  unsaveArticles: (ids: string[]) => void;
  isArticleSaved: (id: string) => boolean | null;
  savedCount: number;
  clearAllSaved: () => void;
  refreshSavedArticles: () => Promise<void>;
}

const MOCK_BACKEND = mockBackendEnabled;
const STORAGE_KEY = "curator.saved-articles";

const SavedArticlesContext = createContext<SavedArticlesContextValue | null>(null);

export function SavedArticlesProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const { hasUnlimitedSaves, maxSaves, tier } = useSubscription();
  const { requestUpgrade } = useUpgradeGate();
  const { requireVerifiedEmail } = useEmailVerificationGate();
  const { showToast } = useToast();
  const userId = session?.user?.id ?? null;

  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(MOCK_BACKEND);
  const [syncError, setSyncError] = useState<string | null>(null);

  const savedArticleIdsRef = useRef(savedArticleIds);
  savedArticleIdsRef.current = savedArticleIds;

  const enqueueMutation = useRef(createSaveMutationQueue()).current;

  const syncFromServer = useCallback((ids: string[]) => {
    setSavedArticleIds(ids);
    setIsHydrated(true);
    setSyncError(null);
    primeSavedArticlesCache([...ids].reverse());
    invalidateSavedArticlesQueries();
    notifyReadingStatsRefresh();
  }, []);

  const refreshSavedArticles = useCallback(async () => {
    if (MOCK_BACKEND || !userId) {
      return;
    }
    try {
      const ids = await listSavedArticleIds();
      syncFromServer(ids);
    } catch {
      setSyncError("Couldn't sync saved articles. Pull down to retry.");
    }
  }, [syncFromServer, userId]);

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
        if (!cancelled) {
          setIsHydrated(true);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if (!userId) {
      setSavedArticleIds([]);
      setIsHydrated(false);
      return;
    }

    setSavedArticleIds([]);
    let cancelled = false;
    setIsHydrated(false);

    const load = async () => {
      try {
        const ids = await listSavedArticleIds();
        if (!cancelled) {
          syncFromServer(ids);
        }
      } catch {
        if (cancelled) {
          return;
        }
        try {
          const ids = await listSavedArticleIds();
          if (!cancelled) {
            syncFromServer(ids);
          }
        } catch {
          if (!cancelled) {
            setSyncError("Couldn't load saved articles. Pull down to retry.");
            setIsHydrated(false);
          }
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [syncFromServer, userId]);

  useEffect(() => {
    if (!syncError || MOCK_BACKEND || !userId) {
      return;
    }
    const timer = setInterval(() => {
      void refreshSavedArticles();
    }, 30_000);
    return () => clearInterval(timer);
  }, [refreshSavedArticles, syncError, userId]);

  const persistMock = useCallback((ids: string[]) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const saveArticle = useCallback(
    (id: string) => {
      if (!MOCK_BACKEND && !userId) {
        showToast("info", "Sign in to save articles.");
        return;
      }
      if (!requireVerifiedEmail("save")) {
        return;
      }

      let shouldPersist = false;
      const previousIds = [...savedArticleIdsRef.current];
      const upgradeTier = tier === "free" ? "basic" : "premium";

      setSavedArticleIds((prev) => {
        if (prev.includes(id)) {
          return prev;
        }

        if (!hasUnlimitedSaves && prev.length >= maxSaves) {
          requestUpgrade({
            featureName: "more saved articles",
            requiredTier: upgradeTier,
          });
          return prev;
        }

        shouldPersist = true;
        const next = [...prev, id];
        if (MOCK_BACKEND) {
          persistMock(next);
        }
        primeSavedArticlesCache([...next].reverse());
        return next;
      });

      if (!shouldPersist || MOCK_BACKEND) {
        return;
      }

      void enqueueMutation(() => saveArticleById(id))
        .then((ids) => {
          syncFromServer(ids);
        })
        .catch((error) => {
          setSavedArticleIds(previousIds);
          dropArticleFromSavedCaches(id);
          const entitlement = parseEntitlementError(error);
          if (entitlement.isEntitlement) {
            requestUpgrade({
              featureName: "more saved articles",
              requiredTier: entitlement.requiredTier,
            });
            return;
          }
          showToast("error", "Couldn't save this article. Try again.");
        });
    },
    [enqueueMutation, hasUnlimitedSaves, maxSaves, persistMock, requestUpgrade, requireVerifiedEmail, showToast, syncFromServer, tier, userId],
  );

  const unsaveArticles = useCallback(
    (ids: string[]) => {
      const uniqueIds = [...new Set(ids.filter(Boolean))];
      if (uniqueIds.length === 0) {
        return;
      }

      if (!MOCK_BACKEND && !userId) {
        return;
      }

      const previousIds = savedArticleIdsRef.current;

      setSavedArticleIds((prev) => {
        const next = prev.filter((articleId) => !uniqueIds.includes(articleId));
        if (MOCK_BACKEND) {
          persistMock(next);
        }
        for (const articleId of uniqueIds) {
          dropArticleFromSavedCaches(articleId);
        }
        notifyArticlesUnsaved(uniqueIds);
        return next;
      });

      if (MOCK_BACKEND) {
        return;
      }

      void enqueueMutation(async () => {
        let latest = previousIds;
        for (const articleId of uniqueIds) {
          latest = await unsaveArticleById(articleId);
        }
        return latest;
      })
        .then((ids) => {
          syncFromServer(ids);
        })
        .catch(() => {
          setSavedArticleIds(previousIds);
          primeSavedArticlesCache([...previousIds].reverse());
          showToast("error", "Couldn't update saved articles. Try again.");
        });
    },
    [enqueueMutation, persistMock, showToast, syncFromServer, userId],
  );

  const unsaveArticle = useCallback(
    (id: string) => {
      unsaveArticles([id]);
    },
    [unsaveArticles],
  );

  const isArticleSaved = useCallback(
    (id: string): boolean | null => {
      if (!isHydrated) {
        return null;
      }
      return savedArticleIds.includes(id);
    },
    [isHydrated, savedArticleIds],
  );

  const clearAllSaved = useCallback(() => {
    const previousIds = savedArticleIdsRef.current;

    setSavedArticleIds([]);
    clearSavedArticlesCaches();
    if (MOCK_BACKEND) {
      void AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (!userId) {
      return;
    }

    notifyArticlesUnsaved(previousIds);

    void enqueueMutation(() => clearSavedArticlesRemote())
      .then((ids) => {
        syncFromServer(ids);
      })
      .catch(() => {
        setSavedArticleIds(previousIds);
        primeSavedArticlesCache([...previousIds].reverse());
        showToast("error", "Couldn't clear saved articles. Try again.");
      });
  }, [enqueueMutation, showToast, syncFromServer, userId]);

  const value = useMemo<SavedArticlesContextValue>(
    () => ({
      savedArticleIds,
      isHydrated,
      syncError,
      saveArticle,
      unsaveArticle,
      unsaveArticles,
      isArticleSaved,
      savedCount: savedArticleIds.length,
      clearAllSaved,
      refreshSavedArticles,
    }),
    [
      savedArticleIds,
      isHydrated,
      syncError,
      saveArticle,
      unsaveArticle,
      unsaveArticles,
      isArticleSaved,
      clearAllSaved,
      refreshSavedArticles,
    ],
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
