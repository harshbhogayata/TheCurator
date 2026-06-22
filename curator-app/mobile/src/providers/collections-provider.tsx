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

import type { Collection } from "../lib/types";
import {
  addArticleToCollectionRemote,
  createCollectionRemote,
  deleteCollectionRemote,
  listCollections,
  removeArticleFromCollectionRemote,
  updateCollectionRemote,
} from "../services/mobile-api";
import { invalidateArticlesByIdsQueries } from "../lib/query-client";
import { useAuth } from "./auth-provider";

interface CollectionsContextValue {
  collections: Collection[];
  isLoading: boolean;
  createCollection: (
    name: string,
    description?: string,
    color?: string,
    icon?: string,
  ) => Collection;
  updateCollection: (id: string, updates: Partial<Pick<Collection, "name" | "description" | "color" | "icon">>) => void;
  deleteCollection: (id: string) => void;
  addArticleToCollection: (collectionId: string, articleId: string) => void;
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
  const { status } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    if (MOCK_BACKEND) {
      let cancelled = false;
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

    if (status !== "signed-in") {
      setCollections([]);
      setIsLoading(false);
      return;
    }

    if (!MOCK_BACKEND) {
      void AsyncStorage.removeItem(STORAGE_KEY);
    }

    let cancelled = false;

    listCollections()
      .then((payload) => {
        if (!cancelled) {
          setCollections(payload);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCollections([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  const createCollection = useCallback(
    (
      name: string,
      description = "",
      color = "#6366f1",
      icon = "folder",
    ): Collection => {
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
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });

      if (!MOCK_BACKEND && status === "signed-in") {
        void createCollectionRemote({ name, description, color, icon })
          .then((serverCollection) => {
            setCollections((prev) =>
              prev.map((current) =>
                current.id === newCollection.id ? serverCollection : current,
              ),
            );
          })
          .catch(() => {
            setCollections((prev) =>
              prev.filter((current) => current.id !== newCollection.id),
            );
          });
      }

      return newCollection;
    },
    [status],
  );

  const updateCollection = useCallback(
    (id: string, updates: Partial<Pick<Collection, "name" | "description" | "color" | "icon">>) => {
      setCollections((prev) => {
        const next = prev.map((collection) =>
          collection.id === id ? { ...collection, ...updates } : collection,
        );
        if (MOCK_BACKEND) {
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });

      if (!MOCK_BACKEND && status === "signed-in" && !id.startsWith("temp-")) {
        void updateCollectionRemote(id, updates)
          .then((serverCollection) => {
            setCollections((prev) =>
              prev.map((collection) =>
                collection.id === id ? serverCollection : collection,
              ),
            );
          })
          .catch(() => {
            // Keep optimistic state on transient failures.
          });
      }
    },
    [status],
  );

  const deleteCollection = useCallback(
    (id: string) => {
      setCollections((prev) => {
        const next = prev.filter((collection) => collection.id !== id);
        if (MOCK_BACKEND) {
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });

      if (!MOCK_BACKEND && status === "signed-in" && !id.startsWith("temp-")) {
        void deleteCollectionRemote(id).catch(() => {
          // Keep optimistic state on transient failures.
        });
      }
    },
    [status],
  );

  const addArticleToCollection = useCallback(
    (collectionId: string, articleId: string) => {
      setCollections((prev) => {
        const next = prev.map((collection) => {
          if (collection.id !== collectionId || collection.articleIds.includes(articleId)) {
            return collection;
          }

          return { ...collection, articleIds: [...collection.articleIds, articleId] };
        });
        if (MOCK_BACKEND) {
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });

      if (!MOCK_BACKEND && status === "signed-in" && !collectionId.startsWith("temp-")) {
        void addArticleToCollectionRemote(collectionId, articleId)
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
          });
      }
    },
    [status],
  );

  const removeArticleFromCollection = useCallback(
    (collectionId: string, articleId: string) => {
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
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });

      if (!MOCK_BACKEND && status === "signed-in" && !collectionId.startsWith("temp-")) {
        void removeArticleFromCollectionRemote(collectionId, articleId)
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
                if (collection.id !== collectionId || collection.articleIds.includes(articleId)) {
                  return collection;
                }

                return {
                  ...collection,
                  articleIds: [...collection.articleIds, articleId],
                };
              }),
            );
          });
      }
    },
    [status],
  );

  const getCollection = useCallback(
    (id: string): Collection | undefined => {
      return collections.find((c) => c.id === id);
    },
    [collections],
  );

  const value = useMemo<CollectionsContextValue>(
    () => ({
      collections,
      isLoading,
      createCollection,
      updateCollection,
      deleteCollection,
      addArticleToCollection,
      removeArticleFromCollection,
      getCollection,
    }),
    [
      collections,
      isLoading,
      createCollection,
      updateCollection,
      deleteCollection,
      addArticleToCollection,
      removeArticleFromCollection,
      getCollection,
    ],
  );

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections(): CollectionsContextValue {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within a CollectionsProvider");
  }
  return context;
}
