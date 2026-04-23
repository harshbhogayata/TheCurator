import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, useColorScheme } from "react-native";

import type { ThemePreference } from "../lib/types";

const STORAGE_KEY = "curator.theme-preference";

type ResolvedTheme = "light" | "dark";

export interface ThemePalette {
  // Core surfaces
  background: string;
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // Text on surfaces
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;

  // Primary
  primary: string;
  primaryDim: string;
  primaryForeground: string;
  primaryContainer: string;
  primaryFixedDim: string;
  onPrimaryContainer: string;

  // Secondary
  secondary: string;
  secondaryDim: string;
  secondaryForeground: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // Tertiary
  tertiary: string;
  tertiaryDim: string;
  tertiaryForeground: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  // Inverse
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  // Utility
  outline: string;
  outlineVariant: string;
  surfaceVariant: string;
  surfaceTint: string;

  // Error
  error: string;
  errorDim: string;
  errorContainer: string;
  onError: string;
  onErrorContainer: string;

  // Success
  successContainer: string;
  onSuccessContainer: string;

  // Borders & inputs
  border: string;
  inputBackground: string;
  switchBackground: string;
  ring: string;
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  palette: ThemePalette;
  isThemeLoaded: boolean;
  setPreference: (value: ThemePreference) => void;
  hydratePreference: (value: ThemePreference | null | undefined) => void;
}

const palettes: Record<ResolvedTheme, ThemePalette> = {
  light: {
    // Core surfaces
    background: "#fbf9f3",
    surface: "#fbf9f3",
    surfaceDim: "#d9dbcd",
    surfaceBright: "#fbf9f3",
    surfaceContainerLowest: "#ffffff",
    surfaceContainerLow: "#f5f4ec",
    surfaceContainer: "#efeee5",
    surfaceContainerHigh: "#e9e9de",
    surfaceContainerHighest: "#e2e3d6",

    // Text
    onBackground: "#31332b",
    onSurface: "#31332b",
    onSurfaceVariant: "#5e6056",

    // Primary
    primary: "#5f5e5e",
    primaryDim: "#535252",
    primaryForeground: "#faf7f6",
    primaryContainer: "#e5e2e1",
    primaryFixedDim: "#d6d4d3",
    onPrimaryContainer: "#525151",

    // Secondary
    secondary: "#625f56",
    secondaryDim: "#55534b",
    secondaryForeground: "#fef8ed",
    secondaryContainer: "#e7e2d7",
    onSecondaryContainer: "#545249",

    // Tertiary
    tertiary: "#5e5f60",
    tertiaryDim: "#525354",
    tertiaryForeground: "#f9f9f9",
    tertiaryContainer: "#f3f3f4",
    onTertiaryContainer: "#5a5c5c",

    // Inverse
    inverseSurface: "#0e0e0b",
    inverseOnSurface: "#9e9d98",
    inversePrimary: "#ffffff",

    // Utility
    outline: "#7a7c71",
    outlineVariant: "#b1b3a7",
    surfaceVariant: "#e2e3d6",
    surfaceTint: "#5f5e5e",

    // Error
    error: "#c78b8b",
    errorDim: "#a66c6c",
    errorContainer: "#f5e0e0",
    onError: "#ffffff",
    onErrorContainer: "#5c3838",

    // Success
    successContainer: "#e8f5e9",
    onSuccessContainer: "#1b5e20",

    // Borders & inputs
    border: "rgba(177, 179, 167, 0.15)",
    inputBackground: "#f5f4ec",
    switchBackground: "#cbced4",
    ring: "#7a7c71",
  },
  dark: {
    // Core surfaces
    background: "#0a0e1a",
    surface: "#0a0e1a",
    surfaceDim: "#060810",
    surfaceBright: "#1a1d2e",
    surfaceContainerLowest: "#12141d",
    surfaceContainerLow: "#16182a",
    surfaceContainer: "#1a1d2e",
    surfaceContainerHigh: "#22253a",
    surfaceContainerHighest: "#2a2d3e",

    // Text
    onBackground: "#e8eaf0",
    onSurface: "#e8eaf0",
    onSurfaceVariant: "#c5c9d6",

    // Primary
    primary: "#7c9fff",
    primaryDim: "#5a7edb",
    primaryForeground: "#0a0e1a",
    primaryContainer: "#1e2842",
    primaryFixedDim: "#1e2842",
    onPrimaryContainer: "#a8b5d6",

    // Secondary
    secondary: "#8a96c7",
    secondaryDim: "#6a76a7",
    secondaryForeground: "#0a0e1a",
    secondaryContainer: "#1a1e33",
    onSecondaryContainer: "#a8b0d6",

    // Tertiary
    tertiary: "#a8a8b3",
    tertiaryDim: "#888893",
    tertiaryForeground: "#0a0e1a",
    tertiaryContainer: "#1e1e28",
    onTertiaryContainer: "#c0c0cb",

    // Inverse
    inverseSurface: "#e8eaf0",
    inverseOnSurface: "#2a2d3e",
    inversePrimary: "#0a0e1a",

    // Utility
    outline: "#6a6e7a",
    outlineVariant: "#2a2d3e",
    surfaceVariant: "#2a2d3e",
    surfaceTint: "#7c9fff",

    // Error
    error: "#ff8a8a",
    errorDim: "#db6a6a",
    errorContainer: "#3a1e1e",
    onError: "#0a0e1a",
    onErrorContainer: "#d6a8a8",

    // Success
    successContainer: "#1b3a1e",
    onSuccessContainer: "#81c784",

    // Borders & inputs
    border: "rgba(106, 110, 122, 0.2)",
    inputBackground: "#16182a",
    switchBackground: "#2a2d3e",
    ring: "#6a6e7a",
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemSchemeHook = useColorScheme();
  // useColorScheme() can return null before the OS reports its value (Android/Expo Go).
  // Track Appearance in state so changes re-render even when useColorScheme stays stale.
  const [appearanceScheme, setAppearanceScheme] = useState(
    () => Appearance.getColorScheme(),
  );
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setAppearanceScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);
  const systemScheme = systemSchemeHook ?? appearanceScheme;
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedValue) => {
        if (
          storedValue === "light" ||
          storedValue === "dark" ||
          storedValue === "system"
        ) {
          setPreferenceState(storedValue);
        }
      })
      .finally(() => {
        setHasLoaded(true);
      });
  }, []);

  const resolvedTheme: ResolvedTheme =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
  }, []);

  const hydratePreference = useCallback(
    (value: ThemePreference | null | undefined) => {
      if (value) {
        setPreferenceState(value);
      }
    },
    [],
  );

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    void AsyncStorage.setItem(STORAGE_KEY, preference);
  }, [hasLoaded, preference]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palettes[resolvedTheme].background);
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      palette: palettes[resolvedTheme],
      isThemeLoaded: hasLoaded,
      setPreference,
      hydratePreference,
    }),
    [hydratePreference, hasLoaded, preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
