import { Link } from 'react-router';

import { StoreDocBlock, StorePageHero } from '../StorePageHero';
import { StoreSiteLayout } from '../StoreSiteLayout';
import { LP, SHAPE_ITEM, STORE_CONTACT } from '../tokens';
import { useStorePageMeta } from '../useStorePageMeta';

export function StorePrivacy() {
  useStorePageMeta({
    title: 'Privacy Policy · The Curator',
    description: 'How The Curator collects, uses, and deletes your data — aligned with App Store App Privacy and Google Play Data safety.',
  });

  return (
    <StoreSiteLayout activeNav="privacy">
      <StorePageHero
        overline="Privacy policy"
        title={<>Your reading life, <span style={{ color: `${LP.onSurface}73` }}>kept quietly.</span></>}
        lede="The Curator is a news reader. We collect only what we need to sign you in, sync your library, bill subscriptions, and keep the app reliable — and we never sell your personal data or track you across other apps."
      />

      <p className="mb-8 text-[13px] font-semibold uppercase tracking-[0.22em]" style={{ color: `${LP.onSurface}66` }}>
        Last updated · June 2026
      </p>

      <div className="space-y-5">
        <StoreDocBlock title="What we collect">
          <p>When you use The Curator on iPhone, iPad, or Android, we may process:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong style={{ color: LP.onSurface }}>Account data</strong> — email address, display name, Firebase user ID, and sign-in provider (email/password, Google, or Sign in with Apple).</li>
            <li><strong style={{ color: LP.onSurface }}>Reading activity</strong> — saved articles, collections, bookmarks, reading history, and preferences needed to sync your library across devices.</li>
            <li><strong style={{ color: LP.onSurface }}>Subscription status</strong> — tier and entitlement state from RevenueCat (Apple App Store or Google Play handles payment details; we do not store card numbers).</li>
            <li><strong style={{ color: LP.onSurface }}>Diagnostics</strong> — crash reports and performance data via Sentry to fix bugs and improve reliability.</li>
          </ul>
        </StoreDocBlock>

        <StoreDocBlock title="What we do not do">
          <ul className="list-disc space-y-2 pl-5">
            <li>We do <strong style={{ color: LP.onSurface }}>not</strong> sell your personal information.</li>
            <li>We do <strong style={{ color: LP.onSurface }}>not</strong> collect the advertising identifier (IDFA) or show the App Tracking Transparency prompt.</li>
            <li>We do <strong style={{ color: LP.onSurface }}>not</strong> track you across other companies&apos; apps or websites for advertising.</li>
          </ul>
          <p>App Store App Privacy labels and Google Play Data safety declarations reflect this.</p>
        </StoreDocBlock>

        <StoreDocBlock title="How we use data">
          <ul className="list-disc space-y-2 pl-5">
            <li>Authenticate you and keep your session secure (Firebase Auth).</li>
            <li>Sync saves, collections, and reading progress to your account.</li>
            <li>Deliver briefings, articles, search, and AI audio narration.</li>
            <li>Process subscriptions and restore purchases (RevenueCat + App Store / Google Play).</li>
            <li>Diagnose crashes and improve performance (Sentry).</li>
            <li>Respond to support and legal requests.</li>
          </ul>
        </StoreDocBlock>

        <StoreDocBlock title="Who we share with">
          <p>We share data only with service providers that help us run The Curator:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong style={{ color: LP.onSurface }}>Firebase</strong> — authentication</li>
            <li><strong style={{ color: LP.onSurface }}>RevenueCat</strong> — subscription management</li>
            <li><strong style={{ color: LP.onSurface }}>Sentry</strong> — error monitoring</li>
            <li><strong style={{ color: LP.onSurface }}>Cloud hosting</strong> — API and content delivery</li>
          </ul>
          <p>We may also disclose information when required by law.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Retention & deletion">
          <p>
            We keep account and reading data while your account is active. You can delete your account and associated data from{' '}
            <strong style={{ color: LP.onSurface }}>Settings → Account</strong> inside the app — no web-only maze required.
          </p>
          <p>
            You may also email{' '}
            <a href={`mailto:${STORE_CONTACT.privacy}`} className="font-semibold underline decoration-[#b1b3a7] underline-offset-4" style={{ color: LP.onSurface }}>
              {STORE_CONTACT.privacy}
            </a>
            {' '}or use our{' '}
            <Link to="/account-deletion" className="font-semibold underline decoration-[#b1b3a7] underline-offset-4" style={{ color: LP.onSurface }}>
              account deletion page
            </Link>
            . Deletion requests are completed within 30 days.
          </p>
          <p>
            To export a copy of your data, use <strong style={{ color: LP.onSurface }}>Settings → Data export</strong> in the app when signed in.
          </p>
        </StoreDocBlock>

        <StoreDocBlock title="Security">
          <p>Traffic between the app and our API is encrypted in transit (HTTPS/TLS). Access to production systems is restricted and audited. No transmission method is perfectly secure; we work to reduce risk continuously.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Children">
          <p>The Curator is not directed at children under 13. We do not knowingly collect personal information from children under 13. Contact us if you believe a child has provided data and we will delete it.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Changes & contact">
          <p>We may update this policy as the app evolves. Material changes will be reflected on this page with an updated date.</p>
          <p>
            Questions about privacy:{' '}
            <a href={`mailto:${STORE_CONTACT.privacy}`} className="font-semibold underline decoration-[#b1b3a7] underline-offset-4" style={{ color: LP.onSurface }}>
              {STORE_CONTACT.privacy}
            </a>
            . General support:{' '}
            <Link to="/support" className="font-semibold underline decoration-[#b1b3a7] underline-offset-4" style={{ color: LP.onSurface }}>
              Support page
            </Link>
            .
          </p>
        </StoreDocBlock>
      </div>

      <div
        className="mt-10 flex flex-wrap gap-3 border px-5 py-4 text-[12px] font-bold"
        style={{ borderColor: `${LP.onSurface}1A`, backgroundColor: LP.container, ...SHAPE_ITEM }}
      >
        <Link to="/terms" className="rounded-full px-4 py-2 transition-colors hover:bg-white/60" style={{ color: LP.onSurface }}>Terms of Use</Link>
        <Link to="/support" className="rounded-full px-4 py-2 transition-colors hover:bg-white/60" style={{ color: LP.onSurface }}>Support</Link>
        <Link to="/account-deletion" className="rounded-full px-4 py-2 transition-colors hover:bg-white/60" style={{ color: LP.onSurface }}>Delete account</Link>
        <Link to="/welcome" className="rounded-full px-4 py-2 transition-colors hover:bg-white/60" style={{ color: LP.onSurface }}>Open app</Link>
      </div>
    </StoreSiteLayout>
  );
}
