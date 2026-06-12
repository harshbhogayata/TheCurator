import { useEffect, useState } from 'react';
import {
  User,
  Bell,
  Palette,
  Globe,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  BookMarked,
  Link2,
  Download,
  Heart,
} from 'lucide-react';
import { useNavigate } from 'react-router';

import { AppShell } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import { updatePreferences } from '../../services/mobile-api';
import {
  disableWebPush,
  enableWebPush,
  getWebPushSubscription,
  isWebPushSupported,
} from '../../lib/web-push';
import type { NotificationFrequency, TextSize, ThemePreference } from '../../lib/types';
import { isMockBackend } from '../../lib/dev-mode';
import { IMAGES } from '../constants/images';

const themeOptions: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'Auto', Icon: Monitor },
];

const notificationOptions: { value: NotificationFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily Brief' },
  { value: 'breaking', label: 'Breaking' },
  { value: 'weekly', label: 'Weekly Digest' },
  { value: 'none', label: 'Quiet Mode' },
];

const textSizeOptions: { value: TextSize; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'large', label: 'Large' },
];

export function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, preferences, signOut, updateSessionPreferences } = useAuth();
  const { tier } = useSubscription();
  const { setTheme } = useTheme();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [webPushBusy, setWebPushBusy] = useState(false);
  const webPushSupported = isWebPushSupported();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!webPushSupported) return;
    void getWebPushSubscription().then((subscription) => {
      setWebPushEnabled(Boolean(subscription) && Notification.permission === 'granted');
    });
  }, [webPushSupported]);

  const toggleWebPush = async (enabled: boolean) => {
    setWebPushBusy(true);
    try {
      if (enabled) {
        setWebPushEnabled(await enableWebPush());
      } else {
        await disableWebPush();
        setWebPushEnabled(false);
      }
    } catch {
      setWebPushEnabled(false);
    } finally {
      setWebPushBusy(false);
    }
  };

  if (!isAuthenticated || !preferences) {
    return null;
  }

  const patchPreferences = async (patch: Parameters<typeof updatePreferences>[0]) => {
    setSaving(true);
    try {
      if (isMockBackend) {
        updateSessionPreferences({ ...preferences, ...patch });
        if (patch.themePreference) {
          setTheme(patch.themePreference);
        }
        return;
      }
      const updated = await updatePreferences(patch);
      updateSessionPreferences(updated);
      if (patch.themePreference) {
        setTheme(patch.themePreference);
      }
    } finally {
      setSaving(false);
    }
  };

  const linkRows = [
    { icon: User, label: 'Account', path: '/account' },
    { icon: Link2, label: 'Connected Accounts', path: '/connected-accounts' },
    { icon: Globe, label: 'Language & Region', path: '/language-region' },
    { icon: BookMarked, label: 'Reading Stats', path: '/reading-stats' },
    { icon: Download, label: 'Data Export', path: '/data-export' },
    { icon: Heart, label: 'Support Us', path: '/donate' },
  ];

  return (
    <AppShell title="Settings">
      <div className="space-y-8">
        <div className="flex items-center gap-4 rounded-[40px] border border-outline-variant/15 bg-surface-container-lowest/70 p-6">
          <img
            src={user?.profileImage || IMAGES.profile.main}
            alt=""
            className="h-16 w-16 rounded-full border-2 border-outline-variant/20 object-cover"
          />
          <div className="flex-1">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface">{user?.name}</h2>
            <p className="text-sm text-outline">{user?.email}</p>
            <div className="mt-2">
              <SubscriptionBadge size="sm" />
            </div>
          </div>
        </div>

        <section>
          <h3 className="mb-3 text-xs uppercase tracking-widest text-outline">Appearance</h3>
          <div className="flex flex-wrap gap-2">
            {themeOptions.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                disabled={saving}
                onClick={() => void patchPreferences({ themePreference: value })}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                  preferences.themePreference === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-outline-variant/20 text-on-surface-variant'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-outline">
            <Bell className="h-4 w-4" /> Notifications
          </h3>
          <div className="flex flex-wrap gap-2">
            {notificationOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={saving}
                onClick={() => void patchPreferences({ notificationFrequency: value })}
                className={`rounded-full border px-4 py-2 text-sm ${
                  preferences.notificationFrequency === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-outline-variant/20 text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {webPushSupported && (
            <label className="mt-4 flex items-center justify-between rounded-[24px] border border-outline-variant/15 bg-surface-container-low p-4">
              <span className="text-on-surface">Browser push notifications</span>
              <input
                type="checkbox"
                checked={webPushEnabled}
                disabled={webPushBusy}
                onChange={(e) => void toggleWebPush(e.target.checked)}
                className="h-5 w-5 accent-primary"
              />
            </label>
          )}
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-outline">
            <Palette className="h-4 w-4" /> Reading
          </h3>
          <div className="flex flex-wrap gap-2">
            {textSizeOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={saving}
                onClick={() => void patchPreferences({ textSize: value })}
                className={`rounded-full border px-4 py-2 text-sm ${
                  preferences.textSize === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-outline-variant/20 text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="mt-4 flex items-center justify-between rounded-[24px] border border-outline-variant/15 bg-surface-container-low p-4">
            <span className="text-on-surface">Auto-save articles</span>
            <input
              type="checkbox"
              checked={preferences.autoSaveEnabled}
              onChange={(e) => void patchPreferences({ autoSaveEnabled: e.target.checked })}
              className="h-5 w-5 accent-primary"
            />
          </label>
        </section>

        <section className="space-y-2">
          {linkRows.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="flex w-full items-center gap-3 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest/70 p-4 text-left hover:bg-surface-container-low"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="flex-1 text-on-surface">{label}</span>
              <ChevronRight className="h-4 w-4 text-outline" />
            </button>
          ))}
        </section>

        <button
          type="button"
          onClick={() => setShowSignOutDialog(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-error/30 py-3 text-error"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        <p className="text-center text-xs text-outline capitalize">{tier} plan</p>
      </div>

      <ConfirmDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={() => {
          signOut();
          navigate('/');
        }}
        title="Sign out?"
        message="You'll need to sign in again to access your saved articles."
        confirmText="Sign Out"
        variant="danger"
      />
    </AppShell>
  );
}
