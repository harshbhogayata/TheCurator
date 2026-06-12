import { useEffect, useId, useRef, useState } from 'react';
import { Bell, Check, Mail, Sparkles, X } from 'lucide-react';

import { useToast } from '../app/components/Toast';
import { launchAlertChipStyle } from './accent';
import { LP, SHAPE_ITEM, STORE_CONTACT } from './tokens';

const STORAGE_KEY = 'curator.launchNotify.email';
const NOTIFY_EVENT = 'curator:launch-notify';

type StoreNotifyButtonProps = {
  variant?: 'header' | 'cta';
};

function NotifyPanel({
  inputId,
  email,
  onEmailChange,
  onSubmit,
  onClose,
  compact,
}: {
  inputId: string;
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
  compact?: boolean;
}) {
  return (
    <>
      <div className={`flex items-start justify-between gap-3 ${compact ? 'mb-2.5' : 'mb-3'}`}>
        <div>
          {!compact && (() => {
            const chip = launchAlertChipStyle({
              bg: LP.secondaryContainer,
              color: LP.onSecondaryContainer,
            });
            return (
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ backgroundColor: chip.bg, color: chip.color, borderColor: chip.border ?? 'transparent' }}
              >
                <Sparkles className="h-3 w-3" /> Launch alert
              </span>
            );
          })()}
          <p
            className={`font-[family-name:var(--font-headline)] italic leading-tight text-[#f5f4ec] ${compact ? 'text-[17px]' : 'mt-2 text-[18px]'}`}
          >
            Be first when we ship
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e9e8e3]/15 transition-colors hover:bg-[#1a1a16]"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-[#e9e8e3]/70" />
        </button>
      </div>

      <p className={`leading-relaxed text-[#e9e8e3]/70 ${compact ? 'mb-2.5 text-[12px]' : 'mb-3 text-[12px]'}`}>
        One email when The Curator goes live. No spam.
      </p>

      <form onSubmit={onSubmit} className="space-y-2.5">
        <label className="sr-only" htmlFor={inputId}>Email address</label>
        <div className="flex items-center gap-2 rounded-full border border-[#e9e8e3]/15 bg-[#1a1a16] px-3.5 py-2">
          <Mail className="h-4 w-4 shrink-0 text-[#e9e8e3]/55" />
          <input
            id={inputId}
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#f5f4ec] outline-none placeholder:text-[#e9e8e3]/35"
          />
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f5f4ec] py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0e0e0b] transition-colors hover:bg-white"
        >
          <Bell className="h-3.5 w-3.5" /> Join the launch list
        </button>
      </form>
    </>
  );
}

export function StoreNotifyButton({ variant = 'header' }: StoreNotifyButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();
  const { notify, error } = useToast();
  const isCta = variant === 'cta';

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSavedEmail(stored);

    const onStored = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setSavedEmail(detail);
      setOpen(false);
    };

    window.addEventListener(NOTIFY_EVENT, onStored);
    return () => window.removeEventListener(NOTIFY_EVENT, onStored);
  }, []);

  useEffect(() => {
    if (!open || isCta) return undefined;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open, isCta]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      error('Enter a valid email so we can reach you at launch.');
      return;
    }

    localStorage.setItem(STORAGE_KEY, trimmed);
    window.dispatchEvent(new CustomEvent(NOTIFY_EVENT, { detail: trimmed }));
    setSavedEmail(trimmed);
    setOpen(false);
    setEmail('');

    notify({
      type: 'success',
      title: "You're on the list",
      message: `We'll email ${trimmed} when The Curator hits the App Store and Google Play.`,
      duration: 6500,
    });
  };

  const handleClick = () => {
    if (savedEmail) {
      notify({
        type: 'info',
        title: 'Launch updates',
        message: `You're already signed up at ${savedEmail}.`,
        duration: 5000,
      });
      return;
    }
    setOpen(true);
  };

  if (isCta && open && !savedEmail) {
    return (
      <div
        ref={panelRef}
        className="w-full rounded-[28px] border border-[#e9e8e3]/12 bg-[#1a1a16] p-4"
        style={SHAPE_ITEM}
        role="dialog"
        aria-label="Get launch notifications"
      >
        <NotifyPanel
          inputId={inputId}
          email={email}
          onEmailChange={setEmail}
          onSubmit={handleSubmit}
          onClose={() => setOpen(false)}
          compact
        />
      </div>
    );
  }

  return (
    <div className={`relative ${isCta ? 'w-full' : 'shrink-0'}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className={
          isCta
            ? 'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f5f4ec] px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[#0e0e0b] transition-colors hover:bg-white'
            : 'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] shadow-[0_8px_24px_-10px_rgba(14,14,11,0.55)] transition-transform hover:scale-[1.02] active:scale-[0.98] md:px-5 md:py-3 md:text-[11px] md:tracking-[0.18em]'
        }
        style={isCta ? undefined : { backgroundColor: LP.onSurface, color: LP.bg }}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {savedEmail ? (
          <>
            <Check className="h-4 w-4" strokeWidth={2.5} />
            {isCta ? "You're on the list" : (
              <>
                <span className="hidden sm:inline">On the list</span>
                <span className="sm:hidden">Listed</span>
              </>
            )}
          </>
        ) : (
          <>
            {isCta ? <Mail className="h-4 w-4" /> : <Bell className="h-3.5 w-3.5" strokeWidth={2.5} />}
            {isCta ? 'Notify me at launch' : 'Notify me'}
          </>
        )}
      </button>

      {open && !savedEmail && !isCta && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Get launch notifications"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(calc(100vw-2rem),320px)] border p-4 shadow-[0_24px_50px_-20px_rgba(49,51,43,0.55)]"
          style={{
            borderColor: `${LP.outlineVariant}4D`,
            backgroundColor: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            ...SHAPE_ITEM,
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em]"
                style={(() => {
                  const chip = launchAlertChipStyle({
                    bg: LP.secondaryContainer,
                    color: LP.onSecondaryContainer,
                  });
                  return { backgroundColor: chip.bg, color: chip.color, borderColor: chip.border ?? 'transparent' };
                })()}
              >
                <Sparkles className="h-3 w-3" /> Launch alert
              </span>
              <p className="mt-2 font-[family-name:var(--font-headline)] text-[18px] italic leading-tight" style={{ color: LP.onSurface }}>
                Be first when we ship
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#efeee5]"
              aria-label="Close"
            >
              <X className="h-4 w-4" style={{ color: LP.outline }} />
            </button>
          </div>

          <p className="mb-3 text-[12px] leading-relaxed" style={{ color: `${LP.onSurface}A6` }}>
            One email when The Curator goes live on the App Store and Google Play. No spam.
          </p>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <label className="sr-only" htmlFor={inputId}>Email address</label>
            <div
              className="flex items-center gap-2 rounded-full border px-3.5 py-2"
              style={{ borderColor: `${LP.outlineVariant}66`, backgroundColor: LP.low }}
            >
              <Mail className="h-4 w-4 shrink-0" style={{ color: LP.outline }} />
              <input
                id={inputId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:opacity-50"
                style={{ color: LP.onSurface }}
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-90"
              style={{ backgroundColor: LP.onSurface, color: LP.bg }}
            >
              <Bell className="h-3.5 w-3.5" /> Join the launch list
            </button>
          </form>

          <p className="mt-2.5 text-[10px] leading-relaxed" style={{ color: `${LP.onSurface}80` }}>
            Or email{' '}
            <a href={`mailto:${STORE_CONTACT.support}`} className="font-semibold underline underline-offset-2" style={{ color: LP.onSurface }}>
              {STORE_CONTACT.support}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
