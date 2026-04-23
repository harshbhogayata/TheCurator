import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { articles } from '../data/articles';

interface ReadingSession {
  articleId: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  date: string; // YYYY-MM-DD
}

interface DailyStats {
  date: string;
  articlesRead: number;
  timeSpent: number; // in seconds
  categories: Record<string, number>;
}

interface ReadingStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string; // YYYY-MM-DD
}

interface ReadingStatsContextType {
  // Sessions
  sessions: ReadingSession[];
  startSession: (articleId: string) => void;
  endSession: (articleId: string) => void;
  
  // Stats
  getTodayStats: () => DailyStats;
  getWeekStats: () => DailyStats[];
  getMonthStats: () => DailyStats[];
  getTotalStats: () => {
    totalArticles: number;
    totalTime: number;
    favoriteCategory: string;
    averageReadTime: number;
  };
  
  // Streak
  streak: ReadingStreak;
  updateStreak: () => void;
  
  // Categories
  getCategoryStats: () => Record<string, number>;
  getMostReadCategory: () => string;
}

const ReadingStatsContext = createContext<ReadingStatsContextType | undefined>(undefined);

export function ReadingStatsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ReadingSession[]>(() => {
    const saved = localStorage.getItem('curator_reading_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeSessions, setActiveSessions] = useState<Record<string, number>>({});
  
  const [streak, setStreak] = useState<ReadingStreak>(() => {
    const saved = localStorage.getItem('curator_reading_streak');
    return saved ? JSON.parse(saved) : {
      currentStreak: 0,
      longestStreak: 0,
      lastReadDate: ''
    };
  });
  
  useEffect(() => {
    localStorage.setItem('curator_reading_sessions', JSON.stringify(sessions));
  }, [sessions]);
  
  useEffect(() => {
    localStorage.setItem('curator_reading_streak', JSON.stringify(streak));
  }, [streak]);
  
  const getDateString = (timestamp: number = Date.now()) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  };
  
  const startSession = (articleId: string) => {
    setActiveSessions(prev => ({
      ...prev,
      [articleId]: Date.now()
    }));
  };
  
  const endSession = (articleId: string) => {
    const startTime = activeSessions[articleId];
    if (!startTime) return;
    
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000); // in seconds
    
    // Only count sessions longer than 10 seconds
    if (duration > 10) {
      const session: ReadingSession = {
        articleId,
        startTime,
        endTime,
        duration,
        date: getDateString(endTime)
      };
      
      setSessions(prev => [...prev, session]);
      updateStreak();
    }
    
    setActiveSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[articleId];
      return newSessions;
    });
  };
  
  const getTodayStats = (): DailyStats => {
    const today = getDateString();
    const todaySessions = sessions.filter(s => s.date === today);
    
    const categories: Record<string, number> = {};
    const uniqueArticles = new Set<string>();
    let totalTime = 0;
    
    todaySessions.forEach(session => {
      uniqueArticles.add(session.articleId);
      totalTime += session.duration;
    });
    
    return {
      date: today,
      articlesRead: uniqueArticles.size,
      timeSpent: totalTime,
      categories
    };
  };
  
  const getWeekStats = (): DailyStats[] => {
    const stats: DailyStats[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getDateString(date.getTime());
      
      const daySessions = sessions.filter(s => s.date === dateStr);
      const uniqueArticles = new Set<string>();
      let totalTime = 0;
      
      daySessions.forEach(session => {
        uniqueArticles.add(session.articleId);
        totalTime += session.duration;
      });
      
      stats.push({
        date: dateStr,
        articlesRead: uniqueArticles.size,
        timeSpent: totalTime,
        categories: {}
      });
    }
    
    return stats;
  };
  
  const getMonthStats = (): DailyStats[] => {
    const stats: DailyStats[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = getDateString(date.getTime());
      
      const daySessions = sessions.filter(s => s.date === dateStr);
      const uniqueArticles = new Set<string>();
      let totalTime = 0;
      
      daySessions.forEach(session => {
        uniqueArticles.add(session.articleId);
        totalTime += session.duration;
      });
      
      stats.push({
        date: dateStr,
        articlesRead: uniqueArticles.size,
        timeSpent: totalTime,
        categories: {}
      });
    }
    
    return stats;
  };
  
  const getTotalStats = () => {
    const uniqueArticles = new Set<string>();
    let totalTime = 0;
    
    sessions.forEach(session => {
      uniqueArticles.add(session.articleId);
      totalTime += session.duration;
    });
    
    return {
      totalArticles: uniqueArticles.size,
      totalTime,
      favoriteCategory: getMostReadCategory(),
      averageReadTime: uniqueArticles.size > 0 ? totalTime / uniqueArticles.size : 0
    };
  };
  
  const getCategoryStats = (): Record<string, number> => {
    const categories: Record<string, number> = {};
    sessions.forEach(session => {
      const article = articles.find(a => a.id === session.articleId);
      if (article) {
        categories[article.category] = (categories[article.category] || 0) + 1;
      }
    });
    return categories;
  };

  const getMostReadCategory = (): string => {
    const categories = getCategoryStats();
    const entries = Object.entries(categories);
    if (entries.length === 0) return '';
    return entries.reduce((best, current) => current[1] > best[1] ? current : best)[0];
  };
  
  const updateStreak = () => {
    const today = getDateString();
    const todaySessions = sessions.filter(s => s.date === today);
    
    if (todaySessions.length === 0) return;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateString(yesterday.getTime());
    
    if (streak.lastReadDate === today) {
      // Already read today, don't update
      return;
    }
    
    if (streak.lastReadDate === yesterdayStr || streak.lastReadDate === '') {
      // Continue streak
      const newStreak = streak.currentStreak + 1;
      setStreak({
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastReadDate: today
      });
    } else {
      // Streak broken
      setStreak({
        currentStreak: 1,
        longestStreak: Math.max(1, streak.longestStreak),
        lastReadDate: today
      });
    }
  };
  
  return (
    <ReadingStatsContext.Provider
      value={{
        sessions,
        startSession,
        endSession,
        getTodayStats,
        getWeekStats,
        getMonthStats,
        getTotalStats,
        getCategoryStats,
        getMostReadCategory,
        streak,
        updateStreak
      }}
    >
      {children}
    </ReadingStatsContext.Provider>
  );
}

export function useReadingStats() {
  const context = useContext(ReadingStatsContext);
  if (context === undefined) {
    throw new Error('useReadingStats must be used within a ReadingStatsProvider');
  }
  return context;
}
