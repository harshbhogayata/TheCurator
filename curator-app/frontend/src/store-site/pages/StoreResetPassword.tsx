import { useMemo, useState } from 'react';
import { confirmPasswordReset, getAuth } from 'firebase/auth';
import { getApps, initializeApp } from 'firebase/app';
import { CheckCircle, KeyRound } from 'lucide-react';

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

export function StoreResetPassword() {
  useStorePageMeta({
    title: 'Reset password · The Curator',
    description: 'Choose a new password for your Curator account.',
  });

  const params = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const status = params.get('status');
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');
  const apiKey = params.get('apiKey') ?? '';

  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [complete, setComplete] = useState(status === 'done');

  const invalid = !complete && (!oobCode || mode !== 'resetPassword' || !apiKey);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!oobCode || !apiKey) return;

    if (password.trim().length < 8) {
      setMessage('Use at least 8 characters.');
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const auth = getFirebaseAuth(apiKey);
      await confirmPasswordReset(auth, oobCode, password.trim());
      setComplete(true);
      setMessage('Password updated. Return to the app and sign in with your new password.');
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      if (code.includes('invalid-action-code') || code.includes('expired-action-code')) {
        setMessage(
          'This link expired or was already used. Request a new reset from the app and open only the newest email.',
        );
      } else if (code.includes('weak-password')) {
        setMessage('Choose a stronger password with at least 8 characters.');
      } else {
        setMessage('Could not reset right now. Request a fresh link from the app.');
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
            {complete ? (
              <CheckCircle size={22} color={LP.onSurface} />
            ) : (
              <KeyRound size={22} color={LP.onSurface} />
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
              {complete ? 'Password updated' : 'Reset your password'}
            </h1>
          </div>

          <p style={{ color: LP.onVariant, lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>
            {complete
              ? 'You can close this page and sign in from the app.'
              : 'Choose a new password below. This stops email apps from using the link before you are ready.'}
          </p>

          {!complete && !invalid ? (
            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              <label
                htmlFor="new-password"
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: LP.onSurface,
                }}
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                style={{
                  width: '100%',
                  border: `1px solid ${LP.outlineVariant}44`,
                  borderRadius: 16,
                  padding: '14px 16px',
                  fontSize: '1rem',
                  fontFamily: 'system-ui, sans-serif',
                  marginBottom: 16,
                }}
              />
              <button
                type="submit"
                disabled={busy}
                style={{
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
                {busy ? 'Updating…' : 'Update password'}
              </button>
            </form>
          ) : null}

          {invalid && !complete ? (
            <p style={{ marginTop: 16, color: LP.error, fontFamily: 'system-ui, sans-serif' }}>
              This link is incomplete or invalid. In the app, tap Send Reset Instructions and open the newest email.
            </p>
          ) : null}

          {message ? (
            <p
              style={{
                marginTop: 16,
                color: complete ? '#3f6d4a' : LP.error,
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
