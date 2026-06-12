import { useEffect } from 'react';
import { CreditCard, ShieldCheck, Link2, ChevronRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AppShell } from '../components/AppShell';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useReadingStats } from '../context/ReadingStatsContext';
import { IMAGES } from '../constants/images';

export function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const { savedCount } = useSavedArticles();
  const { isSubscribed } = useSubscription();
  const { stats } = useReadingStats();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const readCount = stats.totalArticlesRead;
  const memberLabel = isSubscribed ? 'Premium Member' : 'Free Member';
  const profileImage = user?.profileImage || IMAGES.editorial.profile;

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-2xl space-y-10">
        <section className="flex flex-col items-center space-y-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/40 blur-2xl" />
            <div className="relative h-28 w-28 overflow-hidden rounded-full shadow-xl ring-4 ring-white/30 silk-border">
              <ImageWithFallback
                src={profileImage}
                alt={user?.name || 'Profile'}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-medium tracking-tight text-on-surface">
              {user?.name || 'Guest User'}
            </h2>
            <div className="glass-pill inline-flex items-center gap-2 px-5 py-1.5">
              <Award className="h-4 w-4 text-on-surface-variant" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                {memberLabel}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <div className="glass-pill flex items-center justify-between p-6 px-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Summaries Read
              </span>
              <span className="mt-1 text-3xl text-primary">{readCount}</span>
            </div>
            <div className="h-10 w-px bg-outline-variant/20" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Sources Saved
              </span>
              <span className="mt-1 text-3xl text-primary">{savedCount}</span>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="px-2 text-2xl italic text-on-surface">Preferences &amp; Security</h3>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => navigate('/donate')}
              className="glass-pill group flex w-full items-center justify-between p-4 transition-all duration-500 hover:bg-white/60"
            >
              <div className="ml-2 flex items-center gap-5">
                <div className="rounded-full bg-surface-container p-2.5 text-primary transition-transform duration-500 group-hover:scale-110">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-base font-medium text-on-surface">Manage Subscription</span>
              </div>
              <ChevronRight className="mr-2 h-5 w-5 text-outline-variant transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/connected-accounts')}
              className="glass-pill group flex w-full items-center justify-between p-4 transition-all duration-500 hover:bg-white/60"
            >
              <div className="ml-2 flex items-center gap-5">
                <div className="rounded-full bg-surface-container p-2.5 text-primary transition-transform duration-500 group-hover:scale-110">
                  <Link2 className="h-5 w-5" />
                </div>
                <span className="text-base font-medium text-on-surface">Connected Accounts</span>
              </div>
              <ChevronRight className="mr-2 h-5 w-5 text-outline-variant transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/privacy')}
              className="glass-pill group flex w-full items-center justify-between p-4 transition-all duration-500 hover:bg-white/60"
            >
              <div className="ml-2 flex items-center gap-5">
                <div className="rounded-full bg-surface-container p-2.5 text-primary transition-transform duration-500 group-hover:scale-110">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-base font-medium text-on-surface">Privacy Settings</span>
              </div>
              <ChevronRight className="mr-2 h-5 w-5 text-outline-variant transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        <footer className="flex justify-center pb-8 pt-4">
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate('/', { replace: true });
            }}
            className="rounded-full bg-primary px-12 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-on-primary shadow-lg transition-all duration-300 hover:bg-primary-dim active:scale-95"
          >
            Sign Out of Account
          </button>
        </footer>
      </div>
    </AppShell>
  );
}
