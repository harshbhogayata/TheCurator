import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Article } from '../data/articles';

interface SavedArticlesContextType {
  savedArticles: Article[];
  saveArticle: (article: Article) => boolean;
  unsaveArticle: (articleId: string) => void;
  isArticleSaved: (articleId: string) => boolean;
  savedCount: number;
}

const SavedArticlesContext = createContext<SavedArticlesContextType | undefined>(undefined);

export function SavedArticlesProvider({ children }: { children: ReactNode }) {
  const [savedArticles, setSavedArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('curator_saved_articles');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('curator_saved_articles', JSON.stringify(savedArticles));
  }, [savedArticles]);

  const saveArticle = (article: Article): boolean => {
    if (!savedArticles.find(a => a.id === article.id)) {
      setSavedArticles(prev => [...prev, article]);
      return true;
    }
    return false;
  };

  const unsaveArticle = (articleId: string) => {
    setSavedArticles(prev => prev.filter(a => a.id !== articleId));
  };

  const isArticleSaved = (articleId: string): boolean => {
    return savedArticles.some(a => a.id === articleId);
  };

  return (
    <SavedArticlesContext.Provider value={{
      savedArticles,
      saveArticle,
      unsaveArticle,
      isArticleSaved,
      savedCount: savedArticles.length
    }}>
      {children}
    </SavedArticlesContext.Provider>
  );
}

export function useSavedArticles() {
  const context = useContext(SavedArticlesContext);
  if (context === undefined) {
    throw new Error('useSavedArticles must be used within a SavedArticlesProvider');
  }
  return context;
}
