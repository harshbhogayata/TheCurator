import { create } from "zustand";

interface UIState {
  isBusy: boolean;
  globalError: string | null;
  setIsBusy: (busy: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  runBusy: <T>(fn: () => Promise<T>) => Promise<T>;
}

export const useUIStore = create<UIState>((set, get) => ({
  isBusy: false,
  globalError: null,
  setIsBusy: (busy) => set({ isBusy: busy }),
  setError: (error) => set({ globalError: error }),
  clearError: () => set({ globalError: null }),
  runBusy: async <T>(fn: () => Promise<T>): Promise<T> => {
    set({ isBusy: true, globalError: null });
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      set({ globalError: message });
      throw error;
    } finally {
      set({ isBusy: false });
    }
  },
}));
