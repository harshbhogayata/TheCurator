import type { ReactNode } from 'react';
import { Apple, Store } from 'lucide-react';

import { storePill } from './accent';

interface StorePlatformBadgeProps {
  platform: 'apple' | 'google';
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}

export function StorePlatformBadge({ platform, children, className = '', tone = 'light' }: StorePlatformBadgeProps) {
  const pill = storePill(platform, tone);
  const Icon = platform === 'apple' ? Apple : Store;

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
