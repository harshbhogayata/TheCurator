import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Collection } from "../../lib/types";
import type { Article } from "../../data/articles";
import {
  addArticleToCollectionRemote,
  createCollectionRemote,
  deleteCollectionRemote,
  listCollections,
  removeArticleFromCollectionRemote,
  updateCollectionRemote,
} from "../../services/mobile-api";
import { useArticlesByIds } from "../../hooks/use-articles";
import { useAuth } from "./AuthContext";
import { isMockBackend } from "../../lib/dev-mode";

interface CollectionsContextValue {
  collections: Collection[];
  isLoading: boolean;
  createCollection: (name: string, description?: string, color?: string, icon?: string) => Collection;
  updateCollection: (id: string, updates: Partial<Pick<Collection, "name" | "description" | "color" | "icon">>) => void;
  deleteCollection: (id: string) => void;
  addArticleToCollection: (collectionId: string, article: Article) => void;
  removeArticleFromCollection: (collectionId: string, articleId: string) => void;
  getCollectionById: (id: string) => Collection | undefined;
  getCollectionArticles: (id: string) => Article[];
  isArticleInCollection: (collectionId: string, articleId: string) => boolean;
}

const MOCK_BACKEND = isMockBackend;
const STORAGE_KEY = "curator.collections";

function generateId(): string {
  return `temp-${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

const CollectionsContext = createContext<CollectionsContextValue | undefined>(undefined);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    if (MOCK_BACKEND) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setCollections(JSON.parse(stored) as Collection[]);
        } catch {
          setCollections([]);
        }
      }
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setCollections([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    listCollections()
      .then((payload) => {
        if (!cancelled) setCollections(payload);
      })
      .catch(() => {
        if (!cancelled) setCollections([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (MOCK_BACKEND) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
    }
  }, [collections]);

  const createCollection = useCallback(
    (name: string, description = "", color = "#6366f1", icon = "folder"): Collection => {
      const optimistic: Collection = {
        id: generateId(),
        name,
        description,
        color,
        icon,
        articleIds: [],
        createdAt: new Date().toISOString(),
      };

      setCollections((prev) => [optimistic, ...prev]);

      if (!MOCK_BACKEND && isAuthenticated) {
        void createCollectionRemote({ name, description, color, icon })
          .then((serverCollection) => {
            setCollections((prev) =>
              prev.map((c) => (c.id === optimistic.id ? serverCollection : c)),
            );
          })
          .catch(() => {
            setCollections((prev) => prev.filter((c) => c.id !== optimistic.id));
          });
      }

      return optimistic;
    },
    [isAuthenticated],
  );

  const updateCollection = useCallback(
    (id: string, updates: Partial<Pick<Collection, "name" | "description" | "color" | "icon">>) => {
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

      if (!MOCK_BACKEND && isAuthenticated && !id.startsWith("temp-")) {
        void updateCollectionRemote(id, updates).then((serverCollection) => {
          setCollections((prev) => prev.map((c) => (c.id === id ? serverCollection : c)));
        });
      }
    },
    [isAuthenticated],
  );

  const deleteCollection = useCallback(
    (id: string) => {
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (!MOCK_BACKEND && isAuthenticated && !id.startsWith("temp-")) {
        void deleteCollectionRemote(id);
      }
    },
    [isAuthenticated],
  );

  const addArticleToCollection = useCallback(
    (collectionId: string, article: Article) => {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId && !c.articleIds.includes(article.id)
            ? { ...c, articleIds: [...c.articleIds, article.id] }
            : c,
        ),
      );

      if (!MOCK_BACKEND && isAuthenticated && !collectionId.startsWith("temp-")) {
        void addArticleToCollectionRemote(collectionId, article.id)
          .then((serverCollection) => {
            setCollections((prev) =>
              prev.map((c) => (c.id === collectionId ? serverCollection : c)),
            );
          })
          .catch(() => {
            setCollections((prev) =>
              prev.map((c) =>
                c.id === collectionId
                  ? { ...c, articleIds: c.articleIds.filter((aid) => aid !== article.id) }
                  : c,
              ),
            );
          });
      }
    },
    [isAuthenticated],
  );

  const removeArticleFromCollection = useCallback(
    (collectionId: string, articleId: string) => {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId
            ? { ...c, articleIds: c.articleIds.filter((id) => id !== articleId) }
            : c,
        ),
      );

      if (!MOCK_BACKEND && isAuthenticated && !collectionId.startsWith("temp-")) {
        void removeArticleFromCollectionRemote(collectionId, articleId).then((serverCollection) => {
          setCollections((prev) =>
            prev.map((c) => (c.id === collectionId ? serverCollection : c)),
          );
        });
      }
    },
    [isAuthenticated],
  );

  const getCollectionById = useCallback(
    (id: string) => collections.find((c) => c.id === id),
    [collections],
  );

  const isArticleInCollection = useCallback(
    (collectionId: string, articleId: string) => {
      const collection = collections.find((c) => c.id === collectionId);
      return collection ? collection.articleIds.includes(articleId) : false;
    },
    [collections],
  );

  const value = useMemo(
    () => ({
      collections,
      isLoading,
      createCollection,
      updateCollection,
      deleteCollection,
      addArticleToCollection,
      removeArticleFromCollection,
      getCollectionById,
      getCollectionArticles: () => [] as Article[],
      isArticleInCollection,
    }),
    [
      collections,
      isLoading,
      createCollection,
      updateCollection,
      deleteCollection,
      addArticleToCollection,
      removeArticleFromCollection,
      getCollectionById,
      isArticleInCollection,
    ],
  );

  return <CollectionsContext.Provider value={value}>{children}</CollectionsContext.Provider>;
}

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within CollectionsProvider");
  }
  return context;
}

export function useCollectionArticles(collectionId: string): Article[] {
  const { getCollectionById } = useCollections();
  const collection = getCollectionById(collectionId);
  const { data: articles = [] } = useArticlesByIds(collection?.articleIds ?? []);
  return articles;
}
