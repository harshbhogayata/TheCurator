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

import type { Collection } from "../lib/types";
import {
  addArticleToCollectionRemote,
  createCollectionRemote,
  deleteCollectionRemote,
  listCollections,
  removeArticleFromCollectionRemote,
  updateCollectionRemote,
} from "../services/mobile-api";
import { parseEntitlementError } from "../lib/parse-entitlement-error";
import { useAuthUserId, useCanSyncUserData } from "../hooks/use-auth-user";
import { invalidateArticlesByIdsQueries } from "../lib/query-client";
import { createSaveMutationQueue, subscribeArticlesUnsaved } from "../lib/saved-articles-sync";
import { useSubscription } from "./subscription-provider";
import { useUpgradeGate } from "./upgrade-gate-provider";
import { useEmailVerificationGate } from "./email-verification-gate-provider";
import { useToast } from "./toast-provider";

interface CollectionsContextValue {
  collections: Collection[];
  isLoading: boolean;
  loadError: string | null;
  refreshCollections: () => Promise<void>;
  createCollection: (
    name: string,
    description?: string,
    color?: string,
    icon?: string,
  ) => Collection;
  updateCollection: (id: string, updates: Partial<Pick<Collection, "name" | "description" | "color" | "icon">>) => void;
  deleteCollection: (id: string) => void;
  addArticleToCollection: (collectionId: string, articleId: string) => void;
  addArticleToCollections: (collectionIds: string[], articleId: string) => void;
  removeArticleFromCollection: (collectionId: string, articleId: string) => void;
  getCollection: (id: string) => Collection | undefined;
}

const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";
const STORAGE_KEY = "curator.collections";

function generateId(): string {
  return `temp-${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

const CollectionsContext = createContext<CollectionsContextValue | null>(null);

export function CollectionsProvider({ children }: PropsWithChildren) {
  const userId = useAuthUserId();
  const canSync = useCanSyncUserData();
  const { maxCollections } = useSubscription();
  const { requestUpgrade } = useUpgradeGate();
  const { requireVerifiedEmail } = useEmailVerificationGate();
  const { showToast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCollections = useCallback(async () => {
    if (MOCK_BACKEND || !userId) {
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const payload = await listCollections();
      setCollections(payload);
    } catch {
      setCollections([]);
      setLoadError("Couldn't load collections.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refreshCollections = useCallback(async () => {
    await loadCollections();
  }, [loadCollections]);

  const collectionsRef = useRef(collections);
  collectionsRef.current = collections;

  const enqueueMutation = useRef(createSaveMutationQueue()).current;
  const pendingTempAddsRef = useRef<Map<string, string[]>>(new Map());

  useEffect(() => {
    return subscribeArticlesUnsaved((articleIds) => {
      setCollections((current) =>
        current.map((collection) => ({
          ...collection,
          articleIds: collection.articleIds.filter((id) => !articleIds.includes(id)),
        })),
      );
    });
  }, []);

  useEffect(() => {
    if (MOCK_BACKEND) {
      let cancelled = false;
      setIsLoading(true);
      AsyncStorage.getItem(STORAGE_KEY).then((value) => {
        if (!cancelled) {
          if (value) {
            try {
              setCollections(JSON.parse(value));
            } catch {
              setCollections([]);
            }
          }
          setIsLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if (!userId) {
      setCollections([]);
      setIsLoading(false);
      pendingTempAddsRef.current.clear();
      return;
    }

    setCollections([]);
    setIsLoading(true);
    pendingTempAddsRef.current.clear();

    if (!MOCK_BACKEND) {
      void AsyncStorage.removeItem(STORAGE_KEY);
    }

    let cancelled = false;
    void loadCollections().finally(() => {
      if (!cancelled) {
        // loadCollections manages isLoading
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadCollections, userId]);

  const persistMock = useCallback((next: Collection[]) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const flushPendingAdds = useCallback(
    (tempId: string, serverCollection: Collection) => {
      const pending = pendingTempAddsRef.current.get(tempId) ?? [];
      pendingTempAddsRef.current.delete(tempId);
      if (pending.length === 0 || MOCK_BACKEND || !canSync) {
        return;
      }

      void enqueueMutation(async () => {
        let latest = serverCollection;
        for (const articleId of pending) {
          if (!latest.articleIds.includes(articleId)) {
            latest = await addArticleToCollectionRemote(latest.id, articleId);
          }
        }
        return latest;
      }).then((result) => {
        if (!result) {
          return;
        }
        setCollections((prev) =>
          prev.map((collection) => (collection.id === result.id ? result : collection)),
        );
        invalidateArticlesByIdsQueries();
      });
    },
    [canSync, enqueueMutation],
  );

  const createCollection = useCallback(
    (
      name: string,
      description = "",
      color = "#6366f1",
      icon = "folder",
    ): Collection => {
      if (!requireVerifiedEmail("collection")) {
        return {
          id: "",
          name,
          description,
          color,
          icon,
          articleIds: [],
          createdAt: new Date().toISOString(),
        };
      }
      if (
        Number.isFinite(maxCollections) &&
        collectionsRef.current.length >= maxCollections
      ) {
        requestUpgrade({
          featureName: "more collections",
          requiredTier: maxCollections <= 3 ? "basic" : "premium",
        });
        return {
          id: "",
          name,
          description,
          color,
          icon,
          articleIds: [],
          createdAt: new Date().toISOString(),
        };
      }

      const newCollection: Collection = {
        id: generateId(),
        name,
        description,
        color,
        icon,
        articleIds: [],
        createdAt: new Date().toISOString(),
      };

      setCollections((prev) => {
        const next = [newCollection, ...prev];
        if (MOCK_BACKEND) {
          persistMock(next);
        }
        return next;
      });

      if (!MOCK_BACKEND && canSync) {
        void createCollectionRemote({ name, description, color, icon })
          .then((serverCollection) => {
            setCollections((prev) =>
              prev.map((current) =>
                current.id === newCollection.id ? serverCollection : current,
              ),
            );
            flushPendingAdds(newCollection.id, serverCollection);
          })
          .catch((error) => {
            pendingTempAddsRef.current.delete(newCollection.id);
            setCollections((prev) =>
              prev.filter((current) => current.id !== newCollection.id),
            );
            const entitlement = parseEntitlementError(error);
            if (entitlement.isEntitlement) {
              requestUpgrade({
                featureName: "more collections",
                requiredTier: entitlement.requiredTier,
              });
              return;
            }
            showToast("error", "Couldn't create collection. Try again.");
          });
      }

      return newCollection;
    },
    [canSync, flushPendingAdds, maxCollections, persistMock, requestUpgrade, requireVerifiedEmail, showToast],
  );

  const updateCollection = useCallback(
    (id: string, updates: Partial<Pick<Collection, "name" | "description" | "color" | "icon">>) => {
      const previous = collectionsRef.current.find((collection) => collection.id === id);
      if (!previous) {
        return;
      }

      setCollections((prev) => {
        const next = prev.map((collection) =>
          collection.id === id ? { ...collection, ...updates } : collection,
        );
        if (MOCK_BACKEND) {
          persistMock(next);
        }
        return next;
      });

      if (!MOCK_BACKEND && canSync && !id.startsWith("temp-")) {
        void enqueueMutation(() => updateCollectionRemote(id, updates))
          .then((serverCollection) => {
            setCollections((prev) =>
              prev.map((collection) => (collection.id === id ? serverCollection : collection)),
            );
          })
          .catch(() => {
            setCollections((prev) =>
              prev.map((collection) => (collection.id === id ? previous : collection)),
            );
            showToast("error", "Couldn't update collection. Try again.");
          });
      }
    },
    [canSync, enqueueMutation, persistMock],
  );

  const deleteCollection = useCallback(
    (id: string) => {
      const previous = collectionsRef.current;
      setCollections((prev) => {
        const next = prev.filter((collection) => collection.id !== id);
        if (MOCK_BACKEND) {
          persistMock(next);
        }
        return next;
      });
      pendingTempAddsRef.current.delete(id);

      if (!MOCK_BACKEND && canSync && !id.startsWith("temp-")) {
        void enqueueMutation(() => deleteCollectionRemote(id).then(() => id)).catch(() => {
          setCollections(previous);
          showToast("error", "Couldn't delete collection. Try again.");
        });
      }
    },
    [canSync, enqueueMutation, persistMock],
  );

  const addArticleToCollection = useCallback(
    (collectionId: string, articleId: string) => {
      if (!requireVerifiedEmail("collection")) {
        return;
      }
      const target = collectionsRef.current.find((collection) => collection.id === collectionId);
      if (target?.articleIds.includes(articleId)) {
        return;
      }

      setCollections((prev) => {
        const next = prev.map((collection) => {
          if (collection.id !== collectionId || collection.articleIds.includes(articleId)) {
            return collection;
          }
          return { ...collection, articleIds: [...collection.articleIds, articleId] };
        });
        if (MOCK_BACKEND) {
          persistMock(next);
        }
        return next;
      });

      if (MOCK_BACKEND || !canSync) {
        return;
      }

      if (collectionId.startsWith("temp-")) {
        const pending = pendingTempAddsRef.current.get(collectionId) ?? [];
        pendingTempAddsRef.current.set(collectionId, [...pending, articleId]);
        return;
      }

      void enqueueMutation(() => addArticleToCollectionRemote(collectionId, articleId))
        .then((serverCollection) => {
          setCollections((prev) =>
            prev.map((collection) =>
              collection.id === collectionId ? serverCollection : collection,
            ),
          );
          invalidateArticlesByIdsQueries();
        })
        .catch(() => {
          setCollections((prev) =>
            prev.map((collection) => {
              if (collection.id !== collectionId) {
                return collection;
              }
              return {
                ...collection,
                articleIds: collection.articleIds.filter((id) => id !== articleId),
              };
            }),
          );
          showToast("error", "Couldn't add to collection. Try again.");
        });
    },
    [canSync, enqueueMutation, persistMock, requireVerifiedEmail, showToast],
  );

  const addArticleToCollections = useCallback(
    (collectionIds: string[], articleId: string) => {
      const uniqueIds = [...new Set(collectionIds.filter(Boolean))];
      for (const collectionId of uniqueIds) {
        addArticleToCollection(collectionId, articleId);
      }
    },
    [addArticleToCollection],
  );

  const removeArticleFromCollection = useCallback(
    (collectionId: string, articleId: string) => {
      const previous = collectionsRef.current.find((collection) => collection.id === collectionId);
      if (!previous) {
        return;
      }

      setCollections((prev) => {
        const next = prev.map((collection) => {
          if (collection.id !== collectionId) {
            return collection;
          }
          return {
            ...collection,
            articleIds: collection.articleIds.filter((id) => id !== articleId),
          };
        });
        if (MOCK_BACKEND) {
          persistMock(next);
        }
        return next;
      });

      if (collectionId.startsWith("temp-")) {
        const pending = pendingTempAddsRef.current.get(collectionId) ?? [];
        pendingTempAddsRef.current.set(
          collectionId,
          pending.filter((id) => id !== articleId),
        );
      }

      if (!MOCK_BACKEND && canSync && !collectionId.startsWith("temp-")) {
        void enqueueMutation(() => removeArticleFromCollectionRemote(collectionId, articleId))
          .then((serverCollection) => {
            setCollections((prev) =>
              prev.map((collection) =>
                collection.id === collectionId ? serverCollection : collection,
              ),
            );
            invalidateArticlesByIdsQueries();
          })
          .catch(() => {
            setCollections((prev) =>
              prev.map((collection) => (collection.id === collectionId ? previous : collection)),
            );
            showToast("error", "Couldn't remove from collection. Try again.");
          });
      }
    },
    [canSync, enqueueMutation, persistMock, showToast],
  );

  const getCollection = useCallback(
    (id: string): Collection | undefined => collections.find((c) => c.id === id),
    [collections],
  );

  const value = useMemo<CollectionsContextValue>(
    () => ({
      collections,
      isLoading,
      loadError,
      refreshCollections,
      createCollection,
      updateCollection,
      deleteCollection,
      addArticleToCollection,
      addArticleToCollections,
      removeArticleFromCollection,
      getCollection,
    }),
    [
      collections,
      isLoading,
      loadError,
      refreshCollections,
      createCollection,
      updateCollection,
      deleteCollection,
      addArticleToCollection,
      addArticleToCollections,
      removeArticleFromCollection,
      getCollection,
    ],
  );

  return (
    <CollectionsContext.Provider value={value}>{children}</CollectionsContext.Provider>
  );
}

export function useCollections(): CollectionsContextValue {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within a CollectionsProvider");
  }
  return context;
}
