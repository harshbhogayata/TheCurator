import type { ComponentType } from 'react';
import { Folder, Headphones, Quote, Sparkles } from 'lucide-react';

import { STORE_COLOR_ENHANCEMENTS } from './accent';
import { SHAPE_FEATURED, SHAPE_THUMB } from './tokens';

const FEATURES: {
  Icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  n: string;
  title: string;
  body: string;
}[] = [
  {
    Icon: Sparkles,
    n: '01',
    title: 'Daily briefs',
    body: "A narrated digest of the day's biggest stories, distilled from many outlets into a few calm minutes.",
  },
  {
    Icon: Quote,
    n: '02',
    title: 'Source-backed depth',
    body: 'Go deeper with full articles synthesised across sources — every claim traceable to where it came from.',
  },
  {
    Icon: Headphones,
    n: '03',
    title: 'Listen anywhere',
    body: 'Natural AI narration turns any brief or article into hands-free audio, with a floating mini-player.',
  },
  {
    Icon: Folder,
    n: '04',
    title: 'Save & collect',
    body: 'Bookmark what matters and organise reading into your own collections, synced across every device.',
  },
];

export function StoreFeatureCards() {
  return (
    <section className="py-16 md:py-20">
      <div className="mb-12 max-w-2xl">
        <span className="text-[11px] font-black uppercase tracking-[0.34em] text-[#31332b]/45">Why The Curator</span>
        <h2 className="mt-3 font-[family-name:var(--font-headline)] text-[clamp(2rem,5vw,3.5rem)] italic font-medium leading-[1.02] tracking-[-0.02em] text-[#31332b]">
          The whole story,{' '}
          <span className="text-[#31332b]/45">calmly told.</span>
        </h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#31332b]/70 font-medium">
          No infinite feed. No noise. Just the day&apos;s events, distilled into briefings and source-backed articles you can read or hear — wrapped in the same warm, editorial design as the app.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.n}
            className={`group relative overflow-hidden border border-[#31332b]/10 bg-white/55 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 ${
              STORE_COLOR_ENHANCEMENTS
                ? 'hover:border-[#c8bfa6]/30 hover:shadow-[0_22px_44px_-22px_rgba(200,191,166,0.35)]'
                : 'hover:shadow-[0_22px_44px_-22px_rgba(49,51,43,0.4)]'
            }`}
            style={SHAPE_FEATURED}
          >
            <span className="absolute right-5 top-5 font-mono text-[11px] font-bold tracking-widest text-[#31332b]/25">
              {f.n}
            </span>
            <div
              className="mb-6 flex h-12 w-12 items-center justify-center"
              style={{ backgroundColor: '#e7e2d7', ...SHAPE_THUMB }}
            >
              <f.Icon className="h-[22px] w-[22px]" style={{ color: '#545249' }} />
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-[22px] italic leading-tight text-[#31332b]">
              {f.title}
            </h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-[#31332b]/60 font-medium">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
