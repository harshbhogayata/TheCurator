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

import type { TextSize, LineHeight } from "../lib/types";
import { useAuth } from "./auth-provider";

export type { TextSize as FontSize, LineHeight };

export interface ReadingPreferences {
  fontSize: TextSize;
  lineHeight: LineHeight;
}

interface ReadingPreferencesContextValue {
  preferences: ReadingPreferences;
  setFontSize: (size: TextSize) => void;
  setLineHeight: (height: LineHeight) => void;
  hydrateFontSize: (size: TextSize | null | undefined) => void;
  fontSizeValue: number;
  lineHeightValue: number;
}

// v2: key changed when FontSize values unified with TextSize ("compact"/"comfortable"/"large")
const STORAGE_KEY = "curator.reading-preferences.v2";

const FONT_SIZE_MAP: Record<TextSize, number> = {
  compact: 14,
  comfortable: 16,
  large: 18,
};

const LINE_HEIGHT_MAP: Record<LineHeight, number> = {
  compact: 1.4,
  comfortable: 1.6,
  spacious: 1.8,
};

const DEFAULT_PREFERENCES: ReadingPreferences = {
  fontSize: "comfortable",
  lineHeight: "comfortable",
};

interface StoredReadingPreferences {
  lineHeight?: LineHeight;
  /** @deprecated v2 stored fontSize locally; account session is now source of truth */
  fontSize?: TextSize;
}

const TEXT_SIZE_VALUES = new Set<TextSize>(["compact", "comfortable", "large"]);

function isTextSize(value: unknown): value is TextSize {
  return typeof value === "string" && TEXT_SIZE_VALUES.has(value as TextSize);
}

const ReadingPreferencesContext =
  createContext<ReadingPreferencesContextValue | null>(null);

export function ReadingPreferencesProvider({ children }: PropsWithChildren) {
  const { session, status } = useAuth();
  const [preferences, setPreferences] =
    useState<ReadingPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!cancelled && value) {
        try {
          const stored = JSON.parse(value) as StoredReadingPreferences;
          setPreferences((prev) => ({
            ...prev,
            lineHeight: stored.lineHeight ?? prev.lineHeight,
          }));
        } catch {
          // ignore corrupt data
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persistLineHeight = useCallback((lineHeight: LineHeight) => {
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ lineHeight }));
  }, []);

  const hydrateFontSize = useCallback(
    (size: TextSize | null | undefined) => {
      if (!isTextSize(size)) {
        return;
      }

      setPreferences((prev) => {
        if (prev.fontSize === size) {
          return prev;
        }

        return { ...prev, fontSize: size };
      });
    },
    [],
  );

  useEffect(() => {
    if (status !== "signed-in") {
      return;
    }

    hydrateFontSize(session?.preferences.textSize);
  }, [hydrateFontSize, session?.preferences.textSize, status]);

  const setFontSize = useCallback(
    (size: TextSize) => {
      hydrateFontSize(size);
    },
    [hydrateFontSize],
  );

  const setLineHeight = useCallback(
    (height: LineHeight) => {
      setPreferences((prev) => {
        if (prev.lineHeight === height) {
          return prev;
        }

        const next = { ...prev, lineHeight: height };
        persistLineHeight(height);
        return next;
      });
    },
    [persistLineHeight],
  );

  const fontSizeValue = FONT_SIZE_MAP[preferences.fontSize];
  const lineHeightValue = LINE_HEIGHT_MAP[preferences.lineHeight];

  const value = useMemo<ReadingPreferencesContextValue>(
    () => ({
      preferences,
      setFontSize,
      setLineHeight,
      hydrateFontSize,
      fontSizeValue,
      lineHeightValue,
    }),
    [
      preferences,
      setFontSize,
      setLineHeight,
      hydrateFontSize,
      fontSizeValue,
      lineHeightValue,
    ],
  );

  return (
    <ReadingPreferencesContext.Provider value={value}>
      {children}
    </ReadingPreferencesContext.Provider>
  );
}

export function useReadingPreferences(): ReadingPreferencesContextValue {
  const context = useContext(ReadingPreferencesContext);
  if (!context) {
    throw new Error(
      "useReadingPreferences must be used within a ReadingPreferencesProvider",
    );
  }
  return context;
}
