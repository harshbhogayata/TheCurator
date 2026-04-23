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

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
  hideToast: (id: string) => void;
  currentToast: Toast | null;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: PropsWithChildren) {
  const [queue, setQueue] = useState<Toast[]>([]);
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // When current toast is dismissed and queue has items, show next
  useEffect(() => {
    if (currentToast === null && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrentToast(next);
      setQueue(rest);
    }
  }, [currentToast, queue]);

  // Auto-dismiss timer
  useEffect(() => {
    if (currentToast) {
      clearTimer();
      timerRef.current = setTimeout(() => {
        setCurrentToast(null);
      }, AUTO_DISMISS_MS);
    }
    return clearTimer;
  }, [currentToast, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      const toast: Toast = {
        id: Date.now().toString(36),
        type,
        message,
      };

      if (currentToast === null) {
        setCurrentToast(toast);
      } else {
        setQueue((prev) => [...prev, toast]);
      }
    },
    [currentToast],
  );

  const hideToast = useCallback(
    (id: string) => {
      if (currentToast?.id === id) {
        clearTimer();
        setCurrentToast(null);
      } else {
        setQueue((prev) => prev.filter((t) => t.id !== id));
      }
    },
    [currentToast, clearTimer],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      hideToast,
      currentToast,
    }),
    [showToast, hideToast, currentToast],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
