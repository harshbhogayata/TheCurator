import { Link } from 'react-router';
import { Mail, ShieldCheck, Trash2 } from 'lucide-react';

import { StoreDocBlock, StorePageHero } from '../StorePageHero';
import { StoreSiteLayout } from '../StoreSiteLayout';
import { LP, SHAPE_ITEM, STORE_CONTACT } from '../tokens';
import { useStorePageMeta } from '../useStorePageMeta';

const deletionMailto = `mailto:${STORE_CONTACT.privacy}?subject=${encodeURIComponent(
  'The Curator account deletion request',
)}&body=${encodeURIComponent(
  'Please delete my The Curator account and associated data.\n\nAccount email: \nAdditional details (optional): ',
)}`;

export function StoreAccountDeletion() {
  useStorePageMeta({
    title: 'Account Deletion · The Curator',
    description:
      'Request deletion of your The Curator account and associated personal data.',
  });

  return (
    <StoreSiteLayout activeNav="privacy">
      <StorePageHero
        overline="Account deletion"
        title={<>Your account, <span style={{ color: `${LP.onSurface}73` }}>your control.</span></>}
        lede="Delete your account inside The Curator or send us a deletion request from this page. You do not need to reinstall the app."
      />

      <div className="space-y-5">
        <StoreDocBlock title="Delete in the app">
          <p>
            Open <strong style={{ color: LP.onSurface }}>Settings → Account → Delete account</strong>.
            Confirm the warning to permanently delete the account and associated data.
          </p>
          <p>For security, an older session may ask you to sign in again before deletion.</p>
        </StoreDocBlock>

        <StoreDocBlock title="Request deletion on the web">
          <p>
            Email us from the address attached to your account. Include the account email if you
            are writing from a different address so we can verify ownership.
          </p>
          <a
            href={deletionMailto}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[12px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-90"
            style={{ backgroundColor: LP.onSurface, color: LP.bg }}
          >
            <Mail className="h-4 w-4" />
            Request account deletion
          </a>
          <p>
            Requests are completed within 30 days. We will confirm when deletion is finished or
            contact you if identity verification is required.
          </p>
        </StoreDocBlock>

        <StoreDocBlock title="What is deleted">
          <ul className="list-disc space-y-2 pl-5">
            <li>Your authentication account and profile.</li>
            <li>Saved articles, collections, reading history, and preferences.</li>
            <li>Push notification registrations and account-linked subscription metadata.</li>
          </ul>
          <p>
            Limited records may be retained only where required for fraud prevention, security,
            tax, payment, or other legal obligations, as described in our Privacy Policy.
          </p>
        </StoreDocBlock>
      </div>

      <div
        className="mt-10 flex flex-wrap items-center gap-3 border px-5 py-4 text-[12px] font-bold"
        style={{ borderColor: `${LP.onSurface}1A`, backgroundColor: LP.container, ...SHAPE_ITEM }}
      >
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{ backgroundColor: LP.errorContainer, color: LP.onSurface }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Permanent action
        </span>
        <Link
          to="/privacy"
          className="ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors hover:bg-white/60"
          style={{ color: LP.onSurface }}
        >
          <ShieldCheck className="h-4 w-4" />
          Privacy Policy
        </Link>
        <Link
          to="/support"
          className="rounded-full px-4 py-2 transition-colors hover:bg-white/60"
          style={{ color: LP.onSurface }}
        >
          Support
        </Link>
      </div>
    </StoreSiteLayout>
  );
}
