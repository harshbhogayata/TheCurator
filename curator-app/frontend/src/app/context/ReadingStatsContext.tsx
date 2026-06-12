import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchReadingStats, recordReadingEvent } from "../../services/mobile-api";
import { useAuth } from "./AuthContext";
import { isMockBackend } from "../../lib/dev-mode";

interface DailyRecord {
  date: string;
  articlesRead: number;
  readTimeMs: number;
}

interface ReadingStats {
  totalArticlesRead: number;
  totalReadTimeMs: number;
  totalSaved: number;
  currentStreak: number;
  longestStreak: number;
  dailyHistory: DailyRecord[];
  recentArticleIds: string[];
}

interface ReadingStatsContextValue {
  stats: ReadingStats;
  recordArticleRead: (readTimeMs: number, articleId?: string) => void;
  averageReadTimeMs: number;
  thisWeekArticles: number;
  recentArticleIds: string[];
  /** @deprecated use recordArticleRead */
  startSession: (articleId: string) => void;
  /** @deprecated use recordArticleRead */
  endSession: (articleId: string) => void;
}

const MOCK_BACKEND = isMockBackend;
const STORAGE_KEY = "curator.reading-stats";

const DEFAULT_STATS: ReadingStats = {
  totalArticlesRead: 0,
  totalReadTimeMs: 0,
  totalSaved: 0,
  currentStreak: 0,
  longestStreak: 0,
  dailyHistory: [],
  recentArticleIds: [],
};

const ReadingStatsContext = createContext<ReadingStatsContextValue | undefined>(undefined);

function getStartOfWeekDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

export function ReadingStatsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<ReadingStats>(DEFAULT_STATS);
  const [activeSessions, setActiveSessions] = useState<Record<string, number>>({});

  useEffect(() => {
    if (MOCK_BACKEND) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setStats({ ...DEFAULT_STATS, ...JSON.parse(stored) });
        } catch {
          setStats(DEFAULT_STATS);
        }
      }
      return;
    }

    if (!isAuthenticated) {
      setStats(DEFAULT_STATS);
      return;
    }

    let cancelled = false;
    fetchReadingStats()
      .then((payload) => {
        if (!cancelled) {
          setStats({
            totalArticlesRead: payload.totalArticlesRead,
            totalReadTimeMs: payload.totalReadTimeMs,
            totalSaved: payload.totalSaved,
            currentStreak: payload.currentStreak,
            longestStreak: payload.longestStreak,
            dailyHistory: payload.dailyHistory,
            recentArticleIds: payload.recentArticleIds,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setStats(DEFAULT_STATS);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (MOCK_BACKEND) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats]);

  const recordArticleRead = useCallback(
    (readTimeMs: number, articleId?: string) => {
      if (!MOCK_BACKEND && isAuthenticated) {
        void recordReadingEvent({ articleId, readTimeMs })
          .then((payload) => {
            setStats({
              totalArticlesRead: payload.totalArticlesRead,
              totalReadTimeMs: payload.totalReadTimeMs,
              totalSaved: payload.totalSaved,
              currentStreak: payload.currentStreak,
              longestStreak: payload.longestStreak,
              dailyHistory: payload.dailyHistory,
              recentArticleIds: payload.recentArticleIds,
            });
          })
          .catch(() => undefined);
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      setStats((prev) => {
        const existingIndex = prev.dailyHistory.findIndex((r) => r.date === today);
        const dailyHistory =
          existingIndex >= 0
            ? prev.dailyHistory.map((r, i) =>
                i === existingIndex
                  ? { ...r, articlesRead: r.articlesRead + 1, readTimeMs: r.readTimeMs + readTimeMs }
                  : r,
              )
            : [...prev.dailyHistory, { date: today, articlesRead: 1, readTimeMs }];

        const recentArticleIds = articleId
          ? [articleId, ...prev.recentArticleIds.filter((id) => id !== articleId)].slice(0, 8)
          : prev.recentArticleIds;

        return {
          ...prev,
          totalArticlesRead: prev.totalArticlesRead + 1,
          totalReadTimeMs: prev.totalReadTimeMs + readTimeMs,
          dailyHistory,
          recentArticleIds,
        };
      });
    },
    [isAuthenticated],
  );

  const startSession = useCallback((articleId: string) => {
    setActiveSessions((prev) => ({ ...prev, [articleId]: Date.now() }));
  }, []);

  const endSession = useCallback(
    (articleId: string) => {
      const startTime = activeSessions[articleId];
      if (!startTime) return;
      const readTimeMs = Date.now() - startTime;
      if (readTimeMs > 5000) {
        recordArticleRead(readTimeMs, articleId);
      }
      setActiveSessions((prev) => {
        const next = { ...prev };
        delete next[articleId];
        return next;
      });
    },
    [activeSessions, recordArticleRead],
  );

  const averageReadTimeMs = useMemo(() => {
    if (stats.totalArticlesRead === 0) return 0;
    return Math.round(stats.totalReadTimeMs / stats.totalArticlesRead);
  }, [stats.totalArticlesRead, stats.totalReadTimeMs]);

  const thisWeekArticles = useMemo(() => {
    const weekStart = getStartOfWeekDate();
    return stats.dailyHistory
      .filter((r) => r.date >= weekStart)
      .reduce((sum, r) => sum + r.articlesRead, 0);
  }, [stats.dailyHistory]);

  const value = useMemo(
    () => ({
      stats,
      recordArticleRead,
      averageReadTimeMs,
      thisWeekArticles,
      recentArticleIds: stats.recentArticleIds,
      startSession,
      endSession,
    }),
    [stats, recordArticleRead, averageReadTimeMs, thisWeekArticles, startSession, endSession],
  );

  return <ReadingStatsContext.Provider value={value}>{children}</ReadingStatsContext.Provider>;
}

export function useReadingStats() {
  const context = useContext(ReadingStatsContext);
  if (!context) {
    throw new Error("useReadingStats must be used within ReadingStatsProvider");
  }
  return context;
}
