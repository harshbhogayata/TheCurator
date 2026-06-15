import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router';

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'inline';
}

/** Single tasteful upgrade strip — no fake third-party ads on web. */
export function AdBanner({ position = 'inline' }: AdBannerProps) {
  const { hasAdFree } = useSubscription();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  if (hasAdFree || !isVisible) {
    return null;
  }

  return (
    <div className={position === 'top' ? 'mb-6' : position === 'bottom' ? 'mt-6' : 'my-6'}>
      <div className="editorial-card flex items-center gap-4 p-5 md:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-outline">Curator Premium</p>
          <h3 className="mt-1 font-[family-name:var(--font-headline)] text-lg text-on-surface md:text-xl">
            Listen without limits
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Audio briefs, unlimited saves, and a calmer reading experience.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/donate')}
          className="shrink-0 rounded-full bg-inverse-surface px-5 py-2.5 text-sm font-medium text-inverse-on-surface transition-colors hover:bg-primary"
        >
          Upgrade
        </button>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="shrink-0 rounded-full p-2 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
