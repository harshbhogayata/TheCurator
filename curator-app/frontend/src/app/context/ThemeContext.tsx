import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_STORAGE_KEY = "curator_theme";
const LEGACY_THEME_STORAGE_KEYS = ["curator_theme_preference", "curator-theme", "theme"] as const;

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredTheme(): Theme | null {
  const direct = localStorage.getItem(THEME_STORAGE_KEY);
  if (isTheme(direct)) return direct;
  for (const key of LEGACY_THEME_STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (isTheme(value)) return value;
  }
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === "system") {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setEffectiveTheme(systemPrefersDark ? "dark" : "light");
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateEffectiveTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        updateEffectiveTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(effectiveTheme);
  }, [effectiveTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    for (const key of LEGACY_THEME_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  }, []);

  const value = useMemo(
    () => ({ theme, effectiveTheme, setTheme }),
    [theme, effectiveTheme, setTheme],
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
