import { Link } from 'react-router';
import {
  Bookmark,
  CalendarClock,
  CheckCircle2,
  Headphones,
  Library,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { StoreFeatureCards } from '../StoreFeatureCards';
import { StoreNotifyButton } from '../StoreNotifyButton';
import { StorePlatformBadge } from '../StorePlatformBadge';
import { StoreSiteLayout } from '../StoreSiteLayout';
import {
  LAUNCH_LABEL,
  SHAPE_FEATURED,
  SHAPE_HERO,
  SHAPE_ITEM,
  SHAPE_THUMB,
} from '../tokens';

const highlights = [
  { label: 'Format', value: 'Briefs + articles' },
  { label: 'Listen', value: 'AI narration' },
  { label: 'Library', value: 'Saves + collections' },
];

const cards = [
  {
    initials: ['AP', 'WH', 'FA', 'RE'],
    title: 'Middle East diplomacy enters a fragile ceasefire window',
    body: 'A concise narrative built from verified reporting, with context on regional pressure points and what changes next.',
    meta: 'Politics - 3 min read',
  },
  {
    initials: ['WHO', 'CD', 'UN', 'RE'],
    title: 'Global health teams race to contain a fast-moving outbreak',
    body: 'The original reporting stays close at hand while the essential story stays short.',
    meta: 'Health - 4 min read',
  },
  {
    initials: ['SP', 'NA', 'SC', 'FT'],
    title: 'Aerospace teams prepare the next heavy-lift launch',
    body: 'Follow the essential engineering, policy, and market signals without opening a dozen tabs.',
    meta: 'Science - 3 min read',
  },
];

function Countdown() {
  return (
    <div
      className="grid grid-cols-4 gap-2 border bg-white/60 p-2 shadow-[0_18px_50px_-34px_rgba(49,51,43,0.65)]"
      style={{ borderColor: '#31332b1A', ...SHAPE_ITEM }}
      aria-label={`Public launch countdown to ${LAUNCH_LABEL}`}
    >
      {[
        ['Launch', 'Sep'],
        ['Year', '2026'],
        ['iOS', 'Soon'],
        ['Android', 'Soon'],
      ].map(([label, value]) => (
        <div key={label} className="rounded-[1.4rem] bg-[#efeee5] px-2 py-3 text-center">
          <div className="font-[family-name:var(--font-headline)] text-2xl font-semibold italic leading-none text-[#31332b] md:text-3xl">
            {value}
          </div>
          <div className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#31332b]/45">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[380px] lg:max-w-[420px]">
      <div className="absolute -inset-8 rounded-full bg-[#d8cdb6]/35 blur-3xl" />
      <div className="relative rounded-[3.2rem] border-[7px] border-[#25251f] bg-[#fbf9f3] p-4 shadow-[0_34px_90px_-42px_rgba(49,51,43,0.75)]">
        <div className="mx-auto mb-4 h-7 w-24 rounded-full bg-[#25251f]" />
        <div className="mb-5 flex items-center justify-between gap-2">
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#31332b] shadow-[0_12px_26px_-18px_rgba(49,51,43,0.8)]" aria-label="Open menu">
            <Library className="h-5 w-5" />
          </button>
          <div className="rounded-full bg-white px-6 py-3 font-[family-name:var(--font-headline)] text-xl italic text-[#31332b] shadow-[0_12px_26px_-18px_rgba(49,51,43,0.8)]">
            Explore
          </div>
          <div className="flex h-11 items-center rounded-full bg-white px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#31332b]/65 shadow-[0_12px_26px_-18px_rgba(49,51,43,0.8)]">
            Pro
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-headline)] text-[22px] italic text-[#31332b]">
            Top narratives
          </h3>
          <div className="flex gap-1">
            <span className="rounded-full bg-[#efeee5] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#31332b]/55">Today</span>
            <span className="rounded-full bg-[#efeee5] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#31332b]/55">Global</span>
          </div>
        </div>

        <div className="space-y-3">
          {cards.map((card, index) => (
            <article
              key={card.title}
              className="overflow-hidden border border-[#31332b]/10 bg-white/75 p-3"
              style={index === 0 ? SHAPE_FEATURED : SHAPE_ITEM}
            >
              {index === 0 ? (
                <div className="mb-3 flex h-28 items-end justify-between bg-[linear-gradient(135deg,#d7d1c3,#8c9188)] p-3" style={SHAPE_THUMB}>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[#31332b]">
                    <Headphones className="h-4 w-4" />
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[#31332b]">
                    <Bookmark className="h-4 w-4" />
                  </span>
                </div>
              ) : null}
              <div className="mb-2 flex gap-1">
                {card.initials.map((initial) => (
                  <span key={initial} className="grid h-7 w-7 place-items-center rounded-full bg-[#efeee5] text-[9px] font-black text-[#31332b]/65">
                    {initial}
                  </span>
                ))}
              </div>
              <h4 className="font-[family-name:var(--font-headline)] text-[17px] italic leading-tight text-[#31332b]">
                {card.title}
              </h4>
              <p className="mt-2 text-[11px] leading-relaxed text-[#31332b]/62">
                {card.body}
              </p>
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#31332b]/42">
                {card.meta}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="grid gap-3 py-10 sm:grid-cols-3">
      {[
        { Icon: ShieldCheck, label: 'Privacy-ready', text: 'Export and account deletion flows are documented for Play Store review.' },
        { Icon: Search, label: 'Searchable', text: 'Briefs, topics, source-backed articles, and saved collections stay one tap away.' },
        { Icon: CheckCircle2, label: 'App-aligned', text: 'The web launch page uses the same warm paper palette and editorial shapes as mobile.' },
      ].map(({ Icon, label, text }) => (
        <div key={label} className="flex gap-4 rounded-[2rem] border border-[#31332b]/10 bg-white/55 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e7e2d7] text-[#545249]">
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <strong className="block text-sm text-[#31332b]">{label}</strong>
            <span className="mt-1 block text-sm leading-relaxed text-[#31332b]/62">{text}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

export function StoreLanding() {
  return (
    <StoreSiteLayout activeNav="home" mainClassName="pt-10 md:pt-14">
      <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.72fr)]">
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            <StorePlatformBadge platform="apple">App Store - News</StorePlatformBadge>
            <StorePlatformBadge platform="google">Google Play - News & Magazines</StorePlatformBadge>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#31332b]/10 bg-white/55 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#31332b]/55">
              <CalendarClock className="h-3.5 w-3.5" />
              Launching {LAUNCH_LABEL}
            </span>
          </div>

          <span className="text-[12px] font-black uppercase tracking-[0.34em] text-[#31332b]/42">
            A calmer way to read the news
          </span>
          <h1
            className="mt-4 max-w-5xl font-[family-name:var(--font-headline)] text-[clamp(3.3rem,9vw,7.6rem)] font-semibold italic leading-[0.9] tracking-[-0.055em] text-[#31332b]"
            style={SHAPE_HERO}
          >
            The day&apos;s news,
            <span className="block font-light text-[#85816b]">distilled into briefings</span>
            <span className="block font-light text-[#85816b]">you can read or hear.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-[clamp(1rem,2vw,1.22rem)] font-medium leading-relaxed text-[#31332b]/72">
            The Curator reads dozens of trusted sources and condenses each day&apos;s biggest stories into short,
            source-backed briefings. Explore by topic, search the archive, save articles into collections, and
            listen with AI narration without the endless feed.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <StoreNotifyButton />
            <Link
              to="/sign-up"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#31332b]/14 bg-white/60 px-6 text-sm font-black uppercase tracking-[0.16em] text-[#31332b] transition hover:bg-white"
            >
              Try web preview
            </Link>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-[1.65rem] border border-[#31332b]/10 bg-white/50 px-4 py-4">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#31332b]/42">{item.label}</span>
                <p className="mt-1 font-[family-name:var(--font-headline)] text-xl italic text-[#31332b]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <Countdown />
          <PhonePreview />
        </div>
      </section>

      <TrustBar />
      <StoreFeatureCards />

      <section className="grid gap-5 rounded-[2.5rem] border border-[#31332b]/10 bg-[#31332b] p-7 text-[#faf7f6] md:grid-cols-[1fr_minmax(260px,340px)] md:items-center md:p-9">
        <div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#faf7f6]/45">
            Launch list
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-headline)] text-[clamp(2rem,4vw,3.4rem)] italic leading-none">
            Be first in when Curator opens.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#faf7f6]/68 md:text-base">
            One email when the app goes live, plus the support, privacy, terms, and account deletion pages Google Play expects.
          </p>
        </div>
        <div className="justify-self-start md:justify-self-end">
          <StoreNotifyButton variant="cta" />
        </div>
      </section>
    </StoreSiteLayout>
  );
}
