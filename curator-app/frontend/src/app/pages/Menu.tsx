import { useEffect } from 'react';
import { X, Sparkles, Compass, Bookmark, Settings, User, Heart, Info, FileText, HelpCircle, LogOut, Search, BarChart3, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router';

import { AppShell } from '../components/AppShell';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useLayout } from '../../providers/layout-provider';
import { IMAGES } from '../constants/images';

const menuItems = [
  { icon: Sparkles, label: 'Daily Briefs', path: '/brief' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: Search, label: 'Search Articles', path: '/search' },
  { icon: Bookmark, label: 'Saved Articles', path: '/saved' },
  { icon: FolderOpen, label: 'Collections', path: '/collections' },
  { icon: BarChart3, label: 'Reading Stats', path: '/reading-stats' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: Heart, label: 'Support Us', path: '/donate' },
  { icon: Info, label: 'About The Curator', path: '/about' },
  { icon: FileText, label: 'Privacy Policy', path: '/privacy' },
  { icon: HelpCircle, label: 'Help & Support', path: '/help' },
];

export function Menu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { tier } = useSubscription();
  const { isWebDesktop } = useLayout();

  useEffect(() => {
    if (isWebDesktop) {
      navigate('/settings', { replace: true });
    }
  }, [isWebDesktop, navigate]);

  const memberLabel =
    tier === 'lifetime'
      ? 'Lifetime Member'
      : tier === 'premium'
        ? 'Premium Member'
        : tier === 'basic'
          ? 'Basic Member'
          : 'Free Member';

  return (
    <AppShell title="Menu">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-4 rounded-[40px] border border-outline-variant/15 bg-surface-container-lowest/70 p-6">
          <img
            src={user?.profileImage || IMAGES.profile.main}
            alt=""
            className="h-16 w-16 rounded-full border-2 border-outline-variant/30 object-cover"
          />
          <div className="flex-1">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface">{user?.name || 'Guest User'}</h2>
            <div className="mt-1 flex items-center gap-2">
              <SubscriptionBadge size="sm" />
              <span className="text-sm text-outline">{memberLabel}</span>
            </div>
          </div>
          <button type="button" onClick={() => navigate('/account')} className="text-sm text-primary hover:underline">
            Edit Profile
          </button>
        </div>

        <div className="space-y-2">
          {menuItems.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className="flex w-full items-center gap-4 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest/70 p-4 text-left hover:bg-surface-container-low"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container">
                <Icon className="h-5 w-5 text-on-primary-container" />
              </div>
              <span className="text-on-surface">{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            signOut();
            navigate('/');
          }}
          className="flex w-full items-center gap-4 rounded-[24px] border border-outline-variant/15 p-4 text-error hover:bg-error/5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-error-container">
            <LogOut className="h-5 w-5 text-on-error-container" />
          </div>
          Sign Out
        </button>
      </div>
    </AppShell>
  );
}
