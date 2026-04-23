import { useEffect } from 'react';
import { Menu, CreditCard, ShieldCheck, Link2, ChevronRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from '../components/BottomNav';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useSubscription } from '../context/SubscriptionContext';
import { IMAGES } from '../constants/images';

export function Profile() {
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut } = useAuth();
  const { savedCount } = useSavedArticles();
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const readCount = 142;
  const memberLabel = isSubscribed ? 'Premium Member' : 'Free Member';
  const profileImage = user?.profileImage || IMAGES.editorial.profile;

  return (
    <div className="mesh-gradient min-h-screen bg-background pb-36">
      <header className="fixed top-0 z-50 w-full bg-white/70 shadow-[0_4px_12px_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:bg-stone-900/70">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/menu')}
              className="rounded-full p-2 transition-all duration-300 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"
            >
              <Menu className="h-5 w-5 text-stone-800 dark:text-stone-100" />
            </button>
            <h1 className="text-2xl italic tracking-tight text-stone-900 dark:text-stone-50">
              The Curator
            </h1>
          </div>

          <button
            onClick={() => navigate('/account')}
            className="h-10 w-10 overflow-hidden rounded-full silk-border"
          >
            <ImageWithFallback
              src={user?.profileImage || IMAGES.editorial.avatar}
              className="h-full w-full object-cover"
              alt="User avatar"
            />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-10 px-6 pt-28">
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
          <h3 className="px-6 text-2xl italic text-on-surface">Preferences &amp; Security</h3>
          <div className="space-y-4">
            <button
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

        <footer className="flex justify-center pb-8 pt-8">
          <button
            onClick={() => {
              signOut();
              navigate('/', { replace: true });
            }}
            className="rounded-full bg-primary px-12 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-on-primary shadow-lg transition-all duration-300 hover:bg-primary-dim active:scale-95"
          >
            Sign Out of Account
          </button>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}
