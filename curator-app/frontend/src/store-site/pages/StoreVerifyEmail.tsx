import { useMemo, useState } from 'react';
import { applyActionCode, getAuth } from 'firebase/auth';
import { getApps, initializeApp } from 'firebase/app';
import { CheckCircle, MailWarning } from 'lucide-react';

import { StoreSiteLayout } from '../StoreSiteLayout';
import { LP, SHAPE_ITEM } from '../tokens';
import { useStorePageMeta } from '../useStorePageMeta';

const FIREBASE_PUBLIC = {
  authDomain: 'thecuratorin.firebaseapp.com',
  projectId: 'thecuratorin',
  storageBucket: 'thecuratorin.firebasestorage.app',
  messagingSenderId: '558391728349',
  appId: '1:558391728349:web:c074c33fd517dd5b46a334',
} as const;

function getFirebaseAuth(apiKey: string) {
  const config = { ...FIREBASE_PUBLIC, apiKey };
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return getAuth(app);
}

export function StoreVerifyEmail() {
  useStorePageMeta({
    title: 'Verify email · The Curator',
    description: 'Confirm your email address for The Curator.',
  });

  const params = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const status = params.get('status');
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');
  const apiKey = params.get('apiKey') ?? '';

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [verified, setVerified] = useState(status === 'done');

  const invalid = !verified && (!oobCode || mode !== 'verifyEmail' || !apiKey);

  const handleVerify = async () => {
    if (!oobCode || !apiKey) return;
    setBusy(true);
    setMessage(null);
    try {
      const auth = getFirebaseAuth(apiKey);
      await applyActionCode(auth, oobCode);
      setVerified(true);
      setMessage('Email verified. Return to The Curator app and tap I verified on your profile.');
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      if (code.includes('invalid-action-code') || code.includes('expired-action-code')) {
        setMessage(
          'This link expired or was already used. In the app, tap Resend email and open only the newest message.',
        );
      } else {
        setMessage('Could not verify right now. Try Resend email in the app.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <StoreSiteLayout>
      <div className="mx-auto max-w-lg px-6 py-16">
        <div
          style={{
            ...SHAPE_ITEM,
            background: LP.lowest,
            border: `1px solid ${LP.outlineVariant}33`,
            padding: '32px 28px',
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            {verified ? (
              <CheckCircle size={22} color={LP.onSurface} />
            ) : (
              <MailWarning size={22} color={LP.onSurface} />
            )}
            <h1
              style={{
                margin: 0,
                fontFamily: 'Georgia, serif',
                fontSize: '1.75rem',
                fontWeight: 500,
                color: LP.onSurface,
              }}
            >
              {verified ? 'Email verified' : 'Verify your email'}
            </h1>
          </div>

          <p style={{ color: LP.onVariant, lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>
            {verified
              ? 'You can close this page and return to the app.'
              : 'Tap the button below to confirm your address. This stops email apps from using the link before you do.'}
          </p>

          {!verified && !invalid ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleVerify}
              style={{
                marginTop: 20,
                width: '100%',
                border: 0,
                borderRadius: 999,
                padding: '14px 18px',
                background: LP.inverse,
                color: LP.inverseOn,
                fontWeight: 600,
                fontFamily: 'system-ui, sans-serif',
                cursor: busy ? 'wait' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Verifying…' : 'Verify email'}
            </button>
          ) : null}

          {invalid && !verified ? (
            <p style={{ marginTop: 16, color: LP.error, fontFamily: 'system-ui, sans-serif' }}>
              This link is incomplete or invalid. In the app, tap Resend email and open the newest message.
            </p>
          ) : null}

          {message ? (
            <p
              style={{
                marginTop: 16,
                color: verified ? '#3f6d4a' : LP.error,
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </StoreSiteLayout>
  );
}
