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

export type { TextSize as FontSize, LineHeight };

export interface ReadingPreferences {
  fontSize: TextSize;
  lineHeight: LineHeight;
}

interface ReadingPreferencesContextValue {
  preferences: ReadingPreferences;
  setFontSize: (size: TextSize) => void;
  setLineHeight: (height: LineHeight) => void;
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

const ReadingPreferencesContext =
  createContext<ReadingPreferencesContextValue | null>(null);

export function ReadingPreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] =
    useState<ReadingPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!cancelled && value) {
        try {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(value) });
        } catch {
          // ignore corrupt data
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((prefs: ReadingPreferences) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, []);

  const setFontSize = useCallback(
    (size: TextSize) => {
      setPreferences((prev) => {
        const next = { ...prev, fontSize: size };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setLineHeight = useCallback(
    (height: LineHeight) => {
      setPreferences((prev) => {
        const next = { ...prev, lineHeight: height };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const fontSizeValue = FONT_SIZE_MAP[preferences.fontSize];
  const lineHeightValue = LINE_HEIGHT_MAP[preferences.lineHeight];

  const value = useMemo<ReadingPreferencesContextValue>(
    () => ({
      preferences,
      setFontSize,
      setLineHeight,
      fontSizeValue,
      lineHeightValue,
    }),
    [preferences, setFontSize, setLineHeight, fontSizeValue, lineHeightValue],
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
