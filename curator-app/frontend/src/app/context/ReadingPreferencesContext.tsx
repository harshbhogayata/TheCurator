import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ReadingPreferences {
  fontSize: 'small' | 'medium' | 'large';
  readingWidth: 'narrow' | 'medium' | 'wide';
}

interface ArticleProgress {
  articleId: string;
  scrollPosition: number;
  progress: number;
  lastRead: number;
}

interface Highlight {
  id: string;
  articleId: string;
  text: string;
  color: string;
  position: number;
  createdAt: number;
}

interface ArticleTag {
  articleId: string;
  tags: string[];
}

interface ArticleReaction {
  articleId: string;
  reaction: 'insightful' | 'important' | 'eyeopening' | null;
  timestamp: number;
}

interface ReadingPreferencesContextType {
  preferences: ReadingPreferences;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setReadingWidth: (width: 'narrow' | 'medium' | 'wide') => void;
  
  // Article Progress
  articleProgress: Record<string, ArticleProgress>;
  saveProgress: (articleId: string, scrollPosition: number, progress: number) => void;
  getProgress: (articleId: string) => ArticleProgress | null;
  
  // Highlights
  highlights: Highlight[];
  addHighlight: (articleId: string, text: string, color: string, position: number) => void;
  removeHighlight: (id: string) => void;
  getArticleHighlights: (articleId: string) => Highlight[];
  
  // Tags
  articleTags: Record<string, string[]>;
  addTag: (articleId: string, tag: string) => void;
  removeTag: (articleId: string, tag: string) => void;
  getArticleTags: (articleId: string) => string[];
  getAllTags: () => string[];
  
  // Reactions
  reactions: Record<string, ArticleReaction>;
  setReaction: (articleId: string, reaction: 'insightful' | 'important' | 'eyeopening') => void;
  removeReaction: (articleId: string) => void;
  getReaction: (articleId: string) => ArticleReaction | null;
}

const ReadingPreferencesContext = createContext<ReadingPreferencesContextType | undefined>(undefined);

export function ReadingPreferencesProvider({ children }: { children: ReactNode }) {
  // Load preferences from localStorage
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    const saved = localStorage.getItem('curator_reading_preferences');
    return saved ? JSON.parse(saved) : {
      fontSize: 'medium',
      readingWidth: 'medium'
    };
  });
  
  // Load article progress from localStorage
  const [articleProgress, setArticleProgress] = useState<Record<string, ArticleProgress>>(() => {
    const saved = localStorage.getItem('curator_article_progress');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Load highlights from localStorage
  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    const saved = localStorage.getItem('curator_highlights');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Load tags from localStorage
  const [articleTags, setArticleTags] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('curator_article_tags');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Load reactions from localStorage
  const [reactions, setReactions] = useState<Record<string, ArticleReaction>>(() => {
    const saved = localStorage.getItem('curator_article_reactions');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('curator_reading_preferences', JSON.stringify(preferences));
  }, [preferences]);
  
  // Save article progress to localStorage
  useEffect(() => {
    localStorage.setItem('curator_article_progress', JSON.stringify(articleProgress));
  }, [articleProgress]);
  
  // Save highlights to localStorage
  useEffect(() => {
    localStorage.setItem('curator_highlights', JSON.stringify(highlights));
  }, [highlights]);
  
  // Save tags to localStorage
  useEffect(() => {
    localStorage.setItem('curator_article_tags', JSON.stringify(articleTags));
  }, [articleTags]);
  
  // Save reactions to localStorage
  useEffect(() => {
    localStorage.setItem('curator_article_reactions', JSON.stringify(reactions));
  }, [reactions]);
  
  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    setPreferences(prev => ({ ...prev, fontSize: size }));
  };
  
  const setReadingWidth = (width: 'narrow' | 'medium' | 'wide') => {
    setPreferences(prev => ({ ...prev, readingWidth: width }));
  };
  
  const saveProgress = (articleId: string, scrollPosition: number, progress: number) => {
    setArticleProgress(prev => ({
      ...prev,
      [articleId]: {
        articleId,
        scrollPosition,
        progress,
        lastRead: Date.now()
      }
    }));
  };
  
  const getProgress = (articleId: string): ArticleProgress | null => {
    return articleProgress[articleId] || null;
  };
  
  const addHighlight = (articleId: string, text: string, color: string, position: number) => {
    const newHighlight: Highlight = {
      id: `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      articleId,
      text,
      color,
      position,
      createdAt: Date.now()
    };
    setHighlights(prev => [...prev, newHighlight]);
  };
  
  const removeHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };
  
  const getArticleHighlights = (articleId: string): Highlight[] => {
    return highlights.filter(h => h.articleId === articleId);
  };
  
  const addTag = (articleId: string, tag: string) => {
    setArticleTags(prev => ({
      ...prev,
      [articleId]: [...(prev[articleId] || []), tag]
    }));
  };
  
  const removeTag = (articleId: string, tag: string) => {
    setArticleTags(prev => ({
      ...prev,
      [articleId]: prev[articleId]?.filter(t => t !== tag) || []
    }));
  };
  
  const getArticleTags = (articleId: string): string[] => {
    return articleTags[articleId] || [];
  };
  
  const getAllTags = (): string[] => {
    const allTags: string[] = [];
    for (const tags of Object.values(articleTags)) {
      allTags.push(...tags);
    }
    return Array.from(new Set(allTags));
  };
  
  const setReaction = (articleId: string, reaction: 'insightful' | 'important' | 'eyeopening') => {
    setReactions(prev => ({
      ...prev,
      [articleId]: {
        articleId,
        reaction,
        timestamp: Date.now()
      }
    }));
  };
  
  const removeReaction = (articleId: string) => {
    setReactions(prev => ({
      ...prev,
      [articleId]: {
        articleId,
        reaction: null,
        timestamp: Date.now()
      }
    }));
  };
  
  const getReaction = (articleId: string): ArticleReaction | null => {
    return reactions[articleId] || null;
  };
  
  return (
    <ReadingPreferencesContext.Provider
      value={{
        preferences,
        setFontSize,
        setReadingWidth,
        articleProgress,
        saveProgress,
        getProgress,
        highlights,
        addHighlight,
        removeHighlight,
        getArticleHighlights,
        articleTags,
        addTag,
        removeTag,
        getArticleTags,
        getAllTags,
        reactions,
        setReaction,
        removeReaction,
        getReaction
      }}
    >
      {children}
    </ReadingPreferencesContext.Provider>
  );
}

export function useReadingPreferences() {
  const context = useContext(ReadingPreferencesContext);
  if (context === undefined) {
    throw new Error('useReadingPreferences must be used within a ReadingPreferencesProvider');
  }
  return context;
}