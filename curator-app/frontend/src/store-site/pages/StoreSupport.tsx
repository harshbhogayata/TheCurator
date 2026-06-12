import { Link } from 'react-router';
import {
  Apple,
  CreditCard,
  Headphones,
  Mail,
  ShieldCheck,
  Store,
  Trash2,
} from 'lucide-react';

import { StoreDocBlock, StoreFactRow, StorePageHero } from '../StorePageHero';
import { StoreSiteLayout } from '../StoreSiteLayout';
import { LP, SHAPE_FEATURED, SHAPE_ITEM, SHAPE_THUMB, STORE_CONTACT } from '../tokens';
import { useStorePageMeta } from '../useStorePageMeta';

const FAQ = [
  {
    q: 'What is The Curator?',
    a: 'A news reader that distills the day\'s biggest stories into briefings and source-backed articles you can read or listen to — without an infinite scroll feed.',
  },
  {
    q: 'When is it available?',
    a: 'We are launching on the App Store and Google Play in September 2026. This site will update with store links on release day.',
  },
  {
    q: 'Is it free?',
    a: 'Yes — core reading is free and ad-supported. Basic, Premium, and Lifetime upgrades remove ads and unlock audio, collections, and higher save limits.',
  },
  {
    q: 'How do I cancel a subscription?',
    a: 'Subscriptions are managed by Apple or Google, not inside Curator billing. On iPhone: Settings → Apple ID → Subscriptions. On Android: Google Play → Payments & subscriptions.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Open the app → Settings → Account → Delete account, or use the public account deletion page. We complete verified requests within 30 days.',
  },
  {
    q: 'Do you track me across other apps?',
    a: 'No. We do not use the advertising identifier (IDFA) and do not track you across other companies\' apps or websites.',
  },
] as const;

export function StoreSupport() {
  useStorePageMeta({
    title: 'Support · The Curator',
    description: 'Get help with The Curator — contact, subscriptions, account deletion, and App Store / Google Play support information.',
  });

  return (
    <StoreSiteLayout activeNav="support">
      <StorePageHero
        overline="Support"
        title={<>We&apos;re here <span style={{ color: `${LP.onSurface}73` }}>when you need us.</span></>}
        lede="Help centre for accounts, subscriptions, and deletion — plus the contact emails App Store Connect and Google Play expect as your public support URL."
      />

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <div
          id="contact"
          className="border p-6 md:p-7"
          style={{ borderColor: `${LP.onSurface}1A`, backgroundColor: 'rgba(255,255,255,0.55)', ...SHAPE_FEATURED }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center" style={{ backgroundColor: LP.secondaryContainer, ...SHAPE_THUMB }}>
              <Mail className="h-5 w-5" style={{ color: LP.onSecondaryContainer }} />
            </div>
            <h2 className="font-[family-name:var(--font-headline)] text-[24px] italic" style={{ color: LP.onSurface }}>Reach us</h2>
          </div>
          <dl className="space-y-3">
            <StoreFactRow label="General support" value={STORE_CONTACT.support} />
            <StoreFactRow label="Privacy & deletion" value={STORE_CONTACT.privacy} />
            <StoreFactRow label="Response time" value="Within 2 business days" />
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={`mailto:${STORE_CONTACT.support}`}
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[12px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-90"
              style={{ backgroundColor: LP.onSurface, color: LP.bg }}
            >
              <Mail className="h-4 w-4" /> Email support
            </a>
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-white/70"
              style={{ borderColor: `${LP.onSurface}26`, color: LP.onSurface }}
            >
              <ShieldCheck className="h-4 w-4" /> Privacy Policy
            </Link>
            <Link
              to="/account-deletion"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-white/70"
              style={{ borderColor: `${LP.onSurface}26`, color: LP.onSurface }}
            >
              <Trash2 className="h-4 w-4" /> Delete account
            </Link>
          </div>
        </div>

        <div
          className="border p-6 md:p-7"
          style={{ borderColor: `${LP.onSurface}1A`, backgroundColor: 'rgba(255,255,255,0.55)', ...SHAPE_FEATURED }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center" style={{ backgroundColor: LP.secondaryContainer, ...SHAPE_THUMB }}>
              <Store className="h-5 w-5" style={{ color: LP.onSecondaryContainer }} />
            </div>
            <h2 className="font-[family-name:var(--font-headline)] text-[24px] italic" style={{ color: LP.onSurface }}>Store listings</h2>
          </div>
          <dl className="space-y-3">
            <StoreFactRow label="iOS category" value="News" />
            <StoreFactRow label="Android category" value="News & Magazines" />
            <StoreFactRow label="Billing" value="App Store · Google Play" />
            <StoreFactRow label="Legal" value="Privacy · Terms on this site" />
          </dl>
          <p className="mt-5 text-[14px] leading-relaxed" style={{ color: `${LP.onSurface}A6` }}>
            App Store Connect reviewers: test credentials are supplied in review notes, not on this public page.
          </p>
        </div>
      </div>

      <div className="mb-5">
        <span className="text-[11px] font-black uppercase tracking-[0.34em]" style={{ color: `${LP.onSurface}73` }}>Common questions</span>
      </div>

      <div className="space-y-4">
        {FAQ.map((item) => (
          <div
            key={item.q}
            className="border px-6 py-5"
            style={{ borderColor: `${LP.onSurface}1A`, backgroundColor: 'rgba(255,255,255,0.5)', ...SHAPE_ITEM }}
          >
            <h3 className="font-[family-name:var(--font-headline)] text-[18px] italic" style={{ color: LP.onSurface }}>{item.q}</h3>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: `${LP.onSurface}A6` }}>{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { Icon: CreditCard, title: 'Subscriptions', body: 'Manage Basic, Premium, or Lifetime in your Apple ID or Google Play account settings. Restore purchases from Settings in the app.' },
          { Icon: Trash2, title: 'Delete account', body: 'Settings → Account → Delete account in the app, or use the public account deletion page. Verified requests are completed within 30 days.' },
          { Icon: Headphones, title: 'Audio issues', body: 'Premium includes AI narration. Check subscription tier, network connection, and try restoring purchases before contacting support.' },
        ].map((card) => (
          <div
            key={card.title}
            className="border p-5"
            style={{ borderColor: `${LP.onSurface}1A`, backgroundColor: 'rgba(255,255,255,0.55)', ...SHAPE_ITEM }}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center" style={{ backgroundColor: LP.secondaryContainer, ...SHAPE_THUMB }}>
              <card.Icon className="h-[18px] w-[18px]" style={{ color: LP.onSecondaryContainer }} />
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-[17px] italic" style={{ color: LP.onSurface }}>{card.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: `${LP.onSurface}A6` }}>{card.body}</p>
          </div>
        ))}
      </div>

      <div
        className="mt-10 flex flex-wrap items-center gap-3 border px-5 py-4 text-[12px] font-bold"
        style={{ borderColor: `${LP.onSurface}1A`, backgroundColor: LP.container, ...SHAPE_ITEM }}
      >
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ backgroundColor: LP.secondaryContainer, color: LP.onSecondaryContainer }}>
          <Apple className="h-3.5 w-3.5" /> App Store support URL
        </span>
        <span className="font-normal" style={{ color: `${LP.onSurface}99` }}>Use this page URL in App Store Connect</span>
        <Link to="/terms" className="ml-auto rounded-full px-4 py-2 transition-colors hover:bg-white/60" style={{ color: LP.onSurface }}>Terms</Link>
        <Link to="/privacy" className="rounded-full px-4 py-2 transition-colors hover:bg-white/60" style={{ color: LP.onSurface }}>Privacy</Link>
      </div>
    </StoreSiteLayout>
  );
}
