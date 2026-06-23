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

import { fetchReadingStats, recordReadingEvent } from "../services/mobile-api";
import { registerReadingStatsRefresh } from "../lib/stats-sync";
import { createSaveMutationQueue } from "../lib/saved-articles-sync";
import { useAuthUserId } from "../hooks/use-auth-user";

interface DailyRecord {
  date: string; // YYYY-MM-DD
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
  recordSave: () => void;
  refreshReadingStats: () => void;
  averageReadTimeMs: number;
  thisWeekArticles: number;
  recentArticleIds: string[];
}

const MOCK_BACKEND = __DEV__ && process.env.EXPO_PUBLIC_MOCK_BACKEND === "true";
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

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getStartOfWeekDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

function mergeReadingEventIntoStats(
  prev: ReadingStats,
  readTimeMs: number,
  articleId?: string,
): ReadingStats {
  const today = getTodayDate();
  const existingIndex = prev.dailyHistory.findIndex((r) => r.date === today);
  let dailyHistory: DailyRecord[];

  if (existingIndex >= 0) {
    dailyHistory = prev.dailyHistory.map((r, i) =>
      i === existingIndex
        ? {
            ...r,
            articlesRead: r.articlesRead + 1,
            readTimeMs: r.readTimeMs + readTimeMs,
          }
        : r,
    );
  } else {
    dailyHistory = [...prev.dailyHistory, { date: today, articlesRead: 1, readTimeMs }];
  }

  const { currentStreak, longestStreak } = calculateStreak(dailyHistory);

  const recentArticleIds = articleId
    ? [articleId, ...prev.recentArticleIds.filter((id) => id !== articleId)].slice(0, 8)
    : prev.recentArticleIds;

  return {
    ...prev,
    totalArticlesRead: prev.totalArticlesRead + 1,
    totalReadTimeMs: prev.totalReadTimeMs + readTimeMs,
    currentStreak,
    longestStreak,
    dailyHistory,
    recentArticleIds,
  };
}

function payloadToStats(payload: Awaited<ReturnType<typeof fetchReadingStats>>): ReadingStats {
  return {
    totalArticlesRead: payload.totalArticlesRead,
    totalReadTimeMs: payload.totalReadTimeMs,
    totalSaved: payload.totalSaved,
    currentStreak: payload.currentStreak,
    longestStreak: payload.longestStreak,
    dailyHistory: payload.dailyHistory,
    recentArticleIds: payload.recentArticleIds,
  };
}

function calculateStreak(dailyHistory: DailyRecord[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (dailyHistory.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort dates descending
  const activeDates = dailyHistory
    .filter((r) => r.articlesRead > 0)
    .map((r) => r.date)
    .sort()
    .reverse();

  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const today = getTodayDate();
  let currentStreak = 0;
  let longestStreak = 0;

  // Calculate current streak: count consecutive days going backwards from today
  const dateSet = new Set(activeDates);
  const checkDate = new Date(today + "T00:00:00");

  // Allow starting from today or yesterday
  if (!dateSet.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
    if (!dateSet.has(checkDate.toISOString().slice(0, 10))) {
      currentStreak = 0;
    }
  }

  if (currentStreak === 0 && dateSet.has(checkDate.toISOString().slice(0, 10))) {
    const d = new Date(checkDate);
    while (dateSet.has(d.toISOString().slice(0, 10))) {
      currentStreak++;
      d.setDate(d.getDate() - 1);
    }
  }

  // Calculate longest streak from sorted dates
  const sortedAsc = [...activeDates].sort();
  let streak = 1;
  longestStreak = 1;

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1] + "T00:00:00");
    const curr = new Date(sortedAsc[i] + "T00:00:00");
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}

const ReadingStatsContext = createContext<ReadingStatsContextValue | null>(null);

export function ReadingStatsProvider({ children }: PropsWithChildren) {
  const userId = useAuthUserId();
  const [stats, setStats] = useState<ReadingStats>(DEFAULT_STATS);
  const enqueueMutation = useRef(createSaveMutationQueue()).current;

  useEffect(() => {
    if (MOCK_BACKEND) {
      let cancelled = false;
      AsyncStorage.getItem(STORAGE_KEY).then((value) => {
        if (!cancelled && value) {
          try {
            const loaded: ReadingStats = {
              ...DEFAULT_STATS,
              ...JSON.parse(value),
            };
            const { currentStreak, longestStreak } = calculateStreak(loaded.dailyHistory);
            loaded.currentStreak = currentStreak;
            loaded.longestStreak = longestStreak;
            setStats(loaded);
          } catch {
            setStats(DEFAULT_STATS);
          }
        }
      });

      return () => {
        cancelled = true;
      };
    }

    if (!userId) {
      setStats(DEFAULT_STATS);
      return;
    }

    setStats(DEFAULT_STATS);

    if (!MOCK_BACKEND) {
      void AsyncStorage.removeItem(STORAGE_KEY);
    }

    let cancelled = false;

    fetchReadingStats()
      .then((payload) => {
        if (!cancelled) {
          setStats(payloadToStats(payload));
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Keep prior stats on transient failures — do not wipe Continue Reading.
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refreshReadingStats = useCallback(() => {
    if (MOCK_BACKEND || !userId) {
      return;
    }

    void fetchReadingStats()
      .then((payload) => {
        setStats(payloadToStats(payload));
      })
      .catch(() => {
        // Keep current stats on transient failures.
      });
  }, [userId]);

  useEffect(() => {
    return registerReadingStatsRefresh(refreshReadingStats);
  }, [refreshReadingStats]);

  const recordArticleRead = useCallback(
    (readTimeMs: number, articleId?: string) => {
      if (!MOCK_BACKEND && userId) {
        setStats((prev) => mergeReadingEventIntoStats(prev, readTimeMs, articleId));

        void enqueueMutation(() =>
          recordReadingEvent({
            articleId,
            readTimeMs,
          }),
        )
          .then((payload) => {
            setStats(payloadToStats(payload));
          })
          .catch(() => {
            refreshReadingStats();
          });
        return;
      }

      setStats((prev) => {
        const next = mergeReadingEventIntoStats(prev, readTimeMs, articleId);
        if (MOCK_BACKEND) {
          void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [enqueueMutation, refreshReadingStats, userId],
  );

  const recordSave = useCallback(() => {
    if (!MOCK_BACKEND && userId) {
      return;
    }

    setStats((prev) => {
      const next: ReadingStats = {
        ...prev,
        totalSaved: prev.totalSaved + 1,
      };
      if (MOCK_BACKEND) {
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, [userId]);

  const averageReadTimeMs = useMemo(() => {
    if (stats.totalArticlesRead === 0) return 0;
    return Math.round(stats.totalReadTimeMs / stats.totalArticlesRead);
  }, [stats.totalReadTimeMs, stats.totalArticlesRead]);

  const thisWeekArticles = useMemo(() => {
    const weekStart = getStartOfWeekDate();
    return stats.dailyHistory
      .filter((r) => r.date >= weekStart)
      .reduce((sum, r) => sum + r.articlesRead, 0);
  }, [stats.dailyHistory]);

  const value = useMemo<ReadingStatsContextValue>(
    () => ({
      stats,
      recordArticleRead,
      recordSave,
      refreshReadingStats,
      averageReadTimeMs,
      thisWeekArticles,
      recentArticleIds: stats.recentArticleIds,
    }),
    [stats, recordArticleRead, recordSave, refreshReadingStats, averageReadTimeMs, thisWeekArticles],
  );

  return (
    <ReadingStatsContext.Provider value={value}>
      {children}
    </ReadingStatsContext.Provider>
  );
}

export function useReadingStats(): ReadingStatsContextValue {
  const context = useContext(ReadingStatsContext);
  if (!context) {
    throw new Error(
      "useReadingStats must be used within a ReadingStatsProvider",
    );
  }
  return context;
}
