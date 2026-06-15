import { Link } from 'react-router';
import {
  Folder,
  Headphones,
  LockKeyhole,
  Mail,
  Quote,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { LAUNCH_LABEL, LP, STORE_CONTACT, STORE_PLATFORMS } from './tokens';
import { StorePlatformBadge } from './StorePlatformBadge';

export function StoreSiteFooter() {
  return (
    <footer className="relative z-10 mt-2 select-none">
      <div className="relative w-full overflow-hidden border-y py-3.5" style={{ borderColor: `${LP.onSurface}26`, backgroundColor: LP.container }}>
        <div className="store-animate-marquee whitespace-nowrap flex gap-4 text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: `${LP.onSurface}B3` }}>
          <span>THE CURATOR • A CALMER COMPANION FOR THE WORLD IN MOTION • </span>
          <span>FILTER THE NOISE • DISTILL THE DAILY BRIEFING • </span>
          <span>ESTABLISHED 2026 • {STORE_PLATFORMS.marquee} · {LAUNCH_LABEL.toUpperCase()} • </span>
          <span>THE CURATOR • A CALMER COMPANION FOR THE WORLD IN MOTION • </span>
          <span>FILTER THE NOISE • DISTILL THE DAILY BRIEFING • </span>
          <span>ESTABLISHED 2026 • {STORE_PLATFORMS.marquee} · {LAUNCH_LABEL.toUpperCase()} • </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-5 pb-8 pt-12 md:px-8 lg:px-12 md:pt-16">
        <div className="grid gap-10 border-b pb-12 md:grid-cols-[1.5fr_1fr_1fr] md:gap-8" style={{ borderColor: `${LP.onSurface}1A` }}>
          <div className="max-w-sm">
            <span className="font-[family-name:var(--font-headline)] text-[40px] font-medium italic leading-none tracking-tight md:text-5xl" style={{ color: LP.onSurface }}>
              The Curator
            </span>
            <p className="mt-5 text-base font-medium leading-relaxed" style={{ color: `${LP.onSurface}A6` }}>
              A calmer way to read the news — the day&apos;s events distilled into briefings and source-backed articles you can read or hear.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <StorePlatformBadge platform="apple">App Store · {LAUNCH_LABEL}</StorePlatformBadge>
              <StorePlatformBadge platform="google">Google Play · {LAUNCH_LABEL}</StorePlatformBadge>
              <StorePlatformBadge platform="samsung">Galaxy Store · {LAUNCH_LABEL}</StorePlatformBadge>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: `${LP.onSurface}66` }}>In the app</span>
            <ul className="mt-5 space-y-3 text-[14px] font-semibold" style={{ color: `${LP.onSurface}B3` }}>
              <li className="flex items-center gap-2"><Sparkles className="h-4 w-4" style={{ color: LP.outline }} /> Daily briefs</li>
              <li className="flex items-center gap-2"><Quote className="h-4 w-4" style={{ color: LP.outline }} /> Source-backed articles</li>
              <li className="flex items-center gap-2"><Headphones className="h-4 w-4" style={{ color: LP.outline }} /> AI audio narration</li>
              <li className="flex items-center gap-2"><Folder className="h-4 w-4" style={{ color: LP.outline }} /> Saves &amp; collections</li>
            </ul>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: `${LP.onSurface}66` }}>Legal &amp; support</span>
            <ul className="mt-5 space-y-3 text-[14px] font-semibold" style={{ color: `${LP.onSurface}B3` }}>
              <li>
                <Link to="/privacy" className="inline-flex items-center gap-2 transition-colors hover:opacity-100" style={{ color: 'inherit' }}>
                  <LockKeyhole className="h-4 w-4" style={{ color: LP.outline }} /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="inline-flex items-center gap-2 transition-colors hover:opacity-100" style={{ color: 'inherit' }}>
                  <LockKeyhole className="h-4 w-4" style={{ color: LP.outline }} /> Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/support" className="inline-flex items-center gap-2 transition-colors hover:opacity-100" style={{ color: 'inherit' }}>
                  <Mail className="h-4 w-4" style={{ color: LP.outline }} /> Support
                </Link>
              </li>
              <li>
                <Link to="/account-deletion" className="inline-flex items-center gap-2 transition-colors hover:opacity-100" style={{ color: 'inherit' }}>
                  <Trash2 className="h-4 w-4" style={{ color: LP.outline }} /> Account deletion
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-start justify-between gap-3 text-[11px] font-bold sm:flex-row sm:items-center" style={{ color: `${LP.onSurface}80` }}>
          <span>© 2026 The Curator. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/privacy" className="transition-colors hover:opacity-100">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:opacity-100">Terms</Link>
            <Link to="/support" className="transition-colors hover:opacity-100">Support</Link>
            <Link to="/account-deletion" className="transition-colors hover:opacity-100">Account deletion</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
