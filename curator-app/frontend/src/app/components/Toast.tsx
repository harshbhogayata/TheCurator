import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastPayload {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  notify: (payload: {
    message: string;
    title?: string;
    type?: ToastType;
    duration?: number;
  }) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_SHAPE = {
  borderTopLeftRadius: 28,
  borderTopRightRadius: 14,
  borderBottomRightRadius: 36,
  borderBottomLeftRadius: 20,
} as const;

const ICON_TILE = {
  borderTopLeftRadius: 14,
  borderTopRightRadius: 8,
  borderBottomRightRadius: 18,
  borderBottomLeftRadius: 10,
} as const;

function getToastTheme(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        bg: 'var(--secondary-container)',
        border: 'color-mix(in srgb, var(--outline-variant) 30%, transparent)',
        iconBg: 'color-mix(in srgb, var(--secondary-container) 80%, #4caf50 20%)',
        iconColor: '#3d6b42',
        Icon: CheckCircle,
      };
    case 'error':
      return {
        bg: 'var(--error-container)',
        border: 'color-mix(in srgb, var(--error) 25%, transparent)',
        iconBg: 'color-mix(in srgb, var(--error-container) 70%, var(--error) 30%)',
        iconColor: 'var(--on-error-container)',
        Icon: AlertCircle,
      };
    case 'warning':
      return {
        bg: 'var(--secondary-container)',
        border: 'color-mix(in srgb, #c8a84a 35%, transparent)',
        iconBg: 'color-mix(in srgb, var(--secondary-container) 75%, #f5d76e 25%)',
        iconColor: '#7a5c12',
        Icon: AlertTriangle,
      };
    case 'info':
    default:
      return {
        bg: 'var(--primary-container)',
        border: 'color-mix(in srgb, var(--outline-variant) 30%, transparent)',
        iconBg: 'var(--surface-container-high)',
        iconColor: 'var(--primary)',
        Icon: Info,
      };
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<ToastPayload[]>([]);
  const [active, setActive] = useState<ToastPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active && queue.length > 0) {
      const [next, ...rest] = queue;
      setActive(next);
      setQueue(rest);
    }
  }, [active, queue]);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer();
      setActive((current) => (current?.id === id ? null : current));
      setQueue((prev) => prev.filter((t) => t.id !== id));
    },
    [clearTimer],
  );

  useEffect(() => {
    if (!active) return undefined;

    clearTimer();
    if (active.duration > 0) {
      timerRef.current = setTimeout(() => dismiss(active.id), active.duration);
    }

    return clearTimer;
  }, [active, clearTimer, dismiss]);

  const notify = useCallback(
    ({
      message,
      title,
      type = 'info',
      duration = 4500,
    }: {
      message: string;
      title?: string;
      type?: ToastType;
      duration?: number;
    }) => {
      const payload: ToastPayload = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message,
        title,
        type,
        duration,
      };

      setActive((current) => {
        if (!current) return payload;
        setQueue((prev) => [...prev, payload]);
        return current;
      });
    },
    [],
  );

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4500) => {
      notify({ message, type, duration });
    },
    [notify],
  );

  const success = useCallback(
    (message: string, duration = 4500) => notify({ message, type: 'success', duration }),
    [notify],
  );
  const error = useCallback(
    (message: string, duration = 5500) => notify({ message, type: 'error', duration }),
    [notify],
  );
  const info = useCallback(
    (message: string, duration = 4500) => notify({ message, type: 'info', duration }),
    [notify],
  );
  const warning = useCallback(
    (message: string, duration = 5000) => notify({ message, type: 'warning', duration }),
    [notify],
  );

  return (
    <ToastContext.Provider value={{ showToast, notify, success, error, info, warning }}>
      {children}
      <ToastViewport toast={active} queueCount={queue.length} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastViewport({
  toast,
  queueCount,
  onDismiss,
}: {
  toast: ToastPayload | null;
  queueCount: number;
  onDismiss: (id: string) => void;
}) {
  if (!toast) return null;

  const theme = getToastTheme(toast.type);
  const { Icon } = theme;

  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-[92px] z-[250] flex justify-end md:inset-x-auto md:right-8 md:top-[100px]"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto w-full max-w-[min(100%,420px)] overflow-hidden border shadow-[0_18px_48px_-18px_rgba(49,51,43,0.45)] backdrop-blur-xl animate-toast-enter"
        style={{
          backgroundColor: theme.bg,
          borderColor: theme.border,
          ...TOAST_SHAPE,
        }}
        role="status"
      >
        <div className="flex items-start gap-3 px-4 py-3.5 pr-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center"
            style={{ backgroundColor: theme.iconBg, ...ICON_TILE }}
          >
            <Icon className="h-[18px] w-[18px]" style={{ color: theme.iconColor }} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            {toast.title && (
              <p className="font-[family-name:var(--font-headline)] text-[15px] italic leading-tight text-on-surface">
                {toast.title}
              </p>
            )}
            <p className={`text-[13px] font-medium leading-relaxed text-on-surface-variant ${toast.title ? 'mt-1' : ''}`}>
              {toast.message}
            </p>
            {queueCount > 0 && (
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-outline">
                +{queueCount} more
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-container-high/80"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4 text-on-surface-variant" />
          </button>
        </div>

        {toast.duration > 0 && (
          <div className="h-[3px] w-full bg-surface-container-high/80">
            <div
              key={toast.id}
              className="h-full origin-left bg-outline/45 animate-toast-progress"
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
