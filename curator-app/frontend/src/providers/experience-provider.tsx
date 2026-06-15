import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../app/context/AuthContext";
import { prefersReducedMotion } from "../lib/view-transition";

interface ExperienceContextValue {
  reduceMotion: boolean;
}

const ExperienceContext = createContext<ExperienceContextValue | undefined>(undefined);

/** Motion preferences only — no scroll hijacking (Lenis broke auth page clicks). */
export function ExperienceProvider({ children }: { children: ReactNode }) {
  const { preferences } = useAuth();
  const [systemReduceMotion, setSystemReduceMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setSystemReduceMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const reduceMotion = systemReduceMotion || (preferences?.reduceMotionEnabled ?? false);

  const value = useMemo(() => ({ reduceMotion }), [reduceMotion]);

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }
  return context;
}
