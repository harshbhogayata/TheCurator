import { Link } from 'react-router';

import { StoreDocBlock, StorePageHero } from '../StorePageHero';
import { StoreSiteLayout } from '../StoreSiteLayout';
import { LP, SHAPE_ITEM, STORE_CONTACT } from '../tokens';
import { useStorePageMeta } from '../useStorePageMeta';

export function StoreTerms() {
  useStorePageMeta({
    title: 'Terms of Use · The Curator',
    description: 'Terms of Use for The Curator news reader — subscriptions, acceptable use, and account policies for App Store and Google Play.',
  });

  return (
    <StoreSiteLayout activeNav="terms">
      <StorePageHero
        overline="Terms of use"
        title={<>Read calmly, <span style={{ color: `${LP.onSurface}73` }}>use responsibly.</span></>}
        lede="These terms govern your use of The Curator mobile app and this website. By creating an account or using the service, you agree to them."
      />

      <p className="mb-8 text-[13px] font-semibold uppercase tracking-[0.22em]" style={{ color: `${LP.onSurface}66` }}>
        Last updated · June 2026
      </p>

      <div className="space-y-5">
        <StoreDocBlock title="The service">
          <p>
            The Curator provides daily news briefings, source-backed articles, search, saves, collections, and optional AI audio narration. Content is distilled from multiple outlets for informational purposes — it is not financial, medical, or legal advice.
          </p>
          <p>We may update features, sources, or availability as the product evolves.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Accounts & sign-in">
          <p>You need an account to sync saves and subscriptions. Sign in with email/password, Google, or Sign in with Apple on iOS.</p>
          <p>You are responsible for keeping your credentials secure and for activity under your account. Tell us promptly at {STORE_CONTACT.support} if you suspect unauthorized access.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Free tier, ads & subscriptions">
          <p>Core reading is free and may include ads on the free tier. Optional <strong style={{ color: LP.onSurface }}>Basic</strong>, <strong style={{ color: LP.onSurface }}>Premium</strong>, and <strong style={{ color: LP.onSurface }}>Lifetime</strong> purchases remove ads and unlock features such as audio narration, collections, and higher save limits.</p>
          <p>Purchases on iOS are billed through the Apple App Store; on Android through Google Play. RevenueCat manages entitlement state on our backend.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Subscription terms (Apple & Google)">
          <p>
            Payment is charged to your Apple ID or Google Play account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least <strong style={{ color: LP.onSurface }}>24 hours</strong> before the end of the current billing period. Your account is charged for renewal within 24 hours prior to the end of the current period.
          </p>
          <p>
            Manage or cancel in your device&apos;s App Store or Google Play subscription settings. Lifetime purchases are one-time and do not renew. Refunds follow Apple and Google policies — we cannot override store refund decisions.
          </p>
        </StoreDocBlock>

        <StoreDocBlock title="Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Scrape, bulk-download, or resell Curator content or audio.</li>
            <li>Reverse-engineer, interfere with, or overload our systems.</li>
            <li>Use the service to harass others or violate applicable law.</li>
            <li>Circumvent paywalls, subscription checks, or rate limits.</li>
          </ul>
          <p>We may suspend or terminate accounts that abuse the service.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Content & sources">
          <p>Articles and briefings synthesize reporting from third-party publishers. Original rights remain with those sources. We provide attribution and links where applicable. We do not guarantee completeness or real-time accuracy of every story.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Termination & deletion">
          <p>You may delete your account anytime from <strong style={{ color: LP.onSurface }}>Settings → Account</strong> in the app or through our <Link to="/account-deletion" className="font-semibold underline decoration-[#b1b3a7] underline-offset-4" style={{ color: LP.onSurface }}>account deletion page</Link>. See our <Link to="/privacy" className="font-semibold underline decoration-[#b1b3a7] underline-offset-4" style={{ color: LP.onSurface }}>Privacy Policy</Link> for data handling after deletion.</p>
          <p>We may suspend or terminate access for violations of these terms or to protect the service.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Disclaimers & liability">
          <p>The service is provided &quot;as is&quot; to the extent permitted by law. We disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement. Our liability is limited to the maximum extent allowed in your jurisdiction.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Contact">
          <p>
            Questions about these terms:{' '}
            <a href={`mailto:${STORE_CONTACT.support}`} className="font-semibold underline decoration-[#b1b3a7] underline-offset-4" style={{ color: LP.onSurface }}>
              {STORE_CONTACT.support}
            </a>
            . Privacy requests:{' '}
            <a href={`mailto:${STORE_CONTACT.privacy}`} className="font-semibold underline decoration-[#b1b3a7] underline-offset-4" style={{ color: LP.onSurface }}>
              {STORE_CONTACT.privacy}
            </a>
            .
          </p>
        </StoreDocBlock>
      </div>

      <div
        className="mt-10 flex flex-wrap gap-3 border px-5 py-4 text-[12px] font-bold"
        style={{ borderColor: `${LP.onSurface}1A`, backgroundColor: LP.container, ...SHAPE_ITEM }}
      >
        <Link to="/privacy" className="rounded-full px-4 py-2 transition-colors hover:bg-white/60" style={{ color: LP.onSurface }}>Privacy Policy</Link>
        <Link to="/support" className="rounded-full px-4 py-2 transition-colors hover:bg-white/60" style={{ color: LP.onSurface }}>Support</Link>
        <Link to="/" className="rounded-full px-4 py-2 transition-colors hover:bg-white/60" style={{ color: LP.onSurface }}>Coming soon</Link>
      </div>
    </StoreSiteLayout>
  );
}
