import type { ReactNode } from 'react';

import { LP, SHAPE_FEATURED } from './tokens';

interface StorePageHeroProps {
  overline: string;
  title: ReactNode;
  lede: string;
}

export function StorePageHero({ overline, title, lede }: StorePageHeroProps) {
  return (
    <div className="mb-10 max-w-3xl">
      <span className="text-[11px] font-black uppercase tracking-[0.34em]" style={{ color: `${LP.onSurface}73` }}>
        {overline}
      </span>
      <h1 className="mt-3 font-[family-name:var(--font-headline)] text-[clamp(2rem,5vw,3.75rem)] font-medium italic leading-[1.02] tracking-[-0.02em]" style={{ color: LP.onSurface }}>
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg font-medium leading-relaxed" style={{ color: `${LP.onSurface}B3` }}>
        {lede}
      </p>
    </div>
  );
}

interface StoreDocBlockProps {
  title: string;
  children: ReactNode;
}

export function StoreDocBlock({ title, children }: StoreDocBlockProps) {
  return (
    <section
      className="border px-6 py-6 md:px-8 md:py-7"
      style={{ borderColor: `${LP.onSurface}1A`, backgroundColor: 'rgba(255,255,255,0.55)', ...SHAPE_FEATURED }}
    >
      <h2 className="font-[family-name:var(--font-headline)] text-[clamp(1.35rem,2.5vw,1.75rem)] italic leading-tight" style={{ color: LP.onSurface }}>
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed" style={{ color: `${LP.onSurface}B3` }}>
        {children}
      </div>
    </section>
  );
}

interface StoreFactRowProps {
  label: string;
  value: string;
}

export function StoreFactRow({ label, value }: StoreFactRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: `${LP.onSurface}14` }}>
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: `${LP.onSurface}73` }}>{label}</dt>
      <dd className="text-right text-[14px] font-semibold" style={{ color: `${LP.onSurface}D9` }}>{value}</dd>
    </div>
  );
}
