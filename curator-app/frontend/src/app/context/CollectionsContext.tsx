import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Article } from '../data/articles';

export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  articleIds: string[];
}

interface CollectionsContextValue {
  collections: Collection[];
  createCollection: (name: string, description: string, color: string) => Collection;
  deleteCollection: (id: string) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  addArticleToCollection: (collectionId: string, article: Article) => void;
  removeArticleFromCollection: (collectionId: string, articleId: string) => void;
  getCollectionById: (id: string) => Collection | undefined;
  getCollectionArticles: (id: string) => Article[];
  isArticleInCollection: (collectionId: string, articleId: string) => boolean;
}

const CollectionsContext = createContext<CollectionsContextValue | undefined>(undefined);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('curator_collections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old collections to ensure they have articleIds
        return parsed.map((col: any) => ({
          ...col,
          articleIds: col.articleIds || []
        }));
      } catch (e) {
        console.error('Failed to parse collections from localStorage', e);
      }
    }
    return [
      {
        id: '1',
        name: 'Climate & Environment',
        description: 'Articles about climate change and environmental policy',
        color: 'bg-green-500',
        createdAt: 'March 2024',
        articleIds: []
      },
      {
        id: '2',
        name: 'Tech & Innovation',
        description: 'Latest in AI, blockchain, and emerging technologies',
        color: 'bg-blue-500',
        createdAt: 'March 2024',
        articleIds: []
      },
      {
        id: '3',
        name: 'Global Politics',
        description: 'International relations and geopolitical analysis',
        color: 'bg-purple-500',
        createdAt: 'February 2024',
        articleIds: []
      }
    ];
  });

  const [collectionArticles, setCollectionArticles] = useState<Record<string, Article[]>>(() => {
    const saved = localStorage.getItem('curator_collection_articles');
    return saved ? JSON.parse(saved) : {};
  });

  // Persist collections to localStorage
  useEffect(() => {
    localStorage.setItem('curator_collections', JSON.stringify(collections));
  }, [collections]);

  // Persist collection articles to localStorage
  useEffect(() => {
    localStorage.setItem('curator_collection_articles', JSON.stringify(collectionArticles));
  }, [collectionArticles]);

  const createCollection = (name: string, description: string, color: string): Collection => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      description,
      color,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      articleIds: []
    };
    setCollections([...collections, newCollection]);
    return newCollection;
  };

  const deleteCollection = (id: string) => {
    setCollections(collections.filter(c => c.id !== id));
    const updatedArticles = { ...collectionArticles };
    delete updatedArticles[id];
    setCollectionArticles(updatedArticles);
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections(collections.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const addArticleToCollection = (collectionId: string, article: Article) => {
    // Update collection's articleIds
    setCollections(collections.map(c => {
      if (c.id === collectionId && !c.articleIds.includes(article.id)) {
        return { ...c, articleIds: [...c.articleIds, article.id] };
      }
      return c;
    }));

    // Store the actual article data
    setCollectionArticles(prev => {
      const current = prev[collectionId] || [];
      if (current.some(a => a.id === article.id)) {
        return prev;
      }
      return {
        ...prev,
        [collectionId]: [...current, article]
      };
    });
  };

  const removeArticleFromCollection = (collectionId: string, articleId: string) => {
    // Update collection's articleIds
    setCollections(collections.map(c => {
      if (c.id === collectionId) {
        return { ...c, articleIds: c.articleIds.filter(id => id !== articleId) };
      }
      return c;
    }));

    // Remove the article data
    setCollectionArticles(prev => ({
      ...prev,
      [collectionId]: (prev[collectionId] || []).filter(a => a.id !== articleId)
    }));
  };

  const getCollectionById = (id: string): Collection | undefined => {
    return collections.find(c => c.id === id);
  };

  const getCollectionArticles = (id: string): Article[] => {
    return collectionArticles[id] || [];
  };

  const isArticleInCollection = (collectionId: string, articleId: string): boolean => {
    const collection = collections.find(c => c.id === collectionId);
    return collection ? collection.articleIds.includes(articleId) : false;
  };

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        createCollection,
        deleteCollection,
        updateCollection,
        addArticleToCollection,
        removeArticleFromCollection,
        getCollectionById,
        getCollectionArticles,
        isArticleInCollection
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error('useCollections must be used within CollectionsProvider');
  }
  return context;
}
