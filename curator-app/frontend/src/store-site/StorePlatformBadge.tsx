import type { ReactNode } from 'react';
import { Apple, Smartphone, Store } from 'lucide-react';

import { storePill } from './accent';
import type { StorePlatform } from './tokens';

interface StorePlatformBadgeProps {
  platform: StorePlatform;
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}

const PLATFORM_ICONS = {
  apple: Apple,
  google: Store,
  samsung: Smartphone,
} as const;

export function StorePlatformBadge({ platform, children, className = '', tone = 'light' }: StorePlatformBadgeProps) {
  const pill = storePill(platform, tone);
  const Icon = PLATFORM_ICONS[platform];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] ${className}`}
      style={{
        backgroundColor: pill.bg,
        borderColor: pill.border,
        color: pill.text,
      }}
    >
      <Icon className="h-3.5 w-3.5" style={{ color: pill.icon }} />
      {children}
    </span>
  );
}
