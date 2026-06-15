import { Link } from 'react-router';
import { CalendarClock } from 'lucide-react';

import { StoreNotifyButton } from './StoreNotifyButton';
import { navActiveStyle } from './accent';
import { LAUNCH_LABEL, LP, PILL_BORDER, PILL_SURFACE, type StoreNavKey } from './tokens';

const NAV: { key: StoreNavKey; label: string; to: string }[] = [
  { key: 'privacy', label: 'Privacy', to: '/privacy' },
  { key: 'terms', label: 'Terms', to: '/terms' },
  { key: 'support', label: 'Support', to: '/support' },
];

interface StoreSiteHeaderProps {
  active?: StoreNavKey;
}

export function StoreSiteHeader({ active }: StoreSiteHeaderProps) {
  return (
    <header className="relative z-20 mx-auto w-full max-w-[1400px] px-5 pt-6 md:px-8 lg:px-12 select-none">
      <div
        className="flex min-h-[68px] items-center gap-2.5 rounded-full border-2 pl-5 pr-3 py-3 shadow-[0_10px_34px_-14px_rgba(49,51,43,0.3)] md:min-h-[76px] md:py-4 md:pl-7 md:pr-4"
        style={{
          borderColor: PILL_BORDER,
          backgroundColor: PILL_SURFACE,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <Link to="/welcome" className="flex shrink-0 items-center">
          <span className="font-[family-name:var(--font-headline)] text-[28px] font-medium italic leading-none tracking-tight md:text-[34px]" style={{ color: LP.onSurface }}>
            The Curator
          </span>
        </Link>

        <span
          className="ml-2 hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.2em] sm:inline-flex lg:ml-3"
          style={{ backgroundColor: LP.secondaryContainer, color: LP.onSecondaryContainer }}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">App Store &amp; Google Play · </span>
          {LAUNCH_LABEL}
        </span>

        <nav className="ml-auto flex items-center gap-1 md:gap-2">
          {NAV.map((item) => {
            const isActive = active === item.key;
            const activeStyle = navActiveStyle(isActive, LP.container);
            return (
              <Link
                key={item.key}
                to={item.to}
                className="hidden rounded-full px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors sm:inline-flex md:px-4 md:py-3 md:text-[11px] md:tracking-[0.18em]"
                style={{
                  color: isActive ? (activeStyle.color ?? LP.onSurface) : `${LP.onSurface}99`,
                  backgroundColor: activeStyle.backgroundColor,
                  border: activeStyle.border,
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <StoreNotifyButton />
        </nav>
      </div>
    </header>
  );
}
