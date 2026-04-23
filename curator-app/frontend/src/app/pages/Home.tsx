import { useEffect, useState } from 'react';
import { Menu, Play, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from '../components/BottomNav';
import { AdCard } from '../components/AdCard';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { articles } from '../data/articles';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { IMAGES } from '../constants/images';

export function Home() {
  const navigate = useNavigate();
  const { authStatus, isAuthenticated, onboarding, user } = useAuth();
  const { hasAdFree } = useSubscription();
  const [viewMode, setViewMode] = useState<'today' | 'global'>('today');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      navigate('/', { replace: true });
      return;
    }

    if (authStatus === 'authenticated' && onboarding && !onboarding.completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [authStatus, navigate, onboarding]);

  if (authStatus === 'loading' || !isAuthenticated || !onboarding?.completed) {
    return null;
  }

  const displayedArticles = viewMode === 'today' ? articles.slice(0, 2) : articles.slice(6, 8);
  const heroAvatar = user?.profileImage || IMAGES.editorial.avatar;

  return (
    <div className="mesh-gradient min-h-screen bg-background pb-32">
      <header className="fixed top-0 z-50 w-full border-b border-zinc-200/20 bg-white/70 shadow-sm backdrop-blur-xl dark:border-zinc-700/20 dark:bg-zinc-900/70">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/menu')}
              className="rounded-full p-2 transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
            >
              <Menu className="h-5 w-5 text-zinc-800 dark:text-zinc-100" />
            </button>
            <h1 className="text-2xl italic tracking-tight text-zinc-900 dark:text-zinc-50">
              The Curator
            </h1>
          </div>

          <button
            onClick={() => navigate('/account')}
            className="h-8 w-8 overflow-hidden rounded-full silk-border"
          >
            <ImageWithFallback
              src={heroAvatar}
              className="h-full w-full object-cover"
              alt="User profile avatar"
            />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-24">
        <section className="mb-12">
          <div
            onClick={() => navigate('/brief')}
            className="group flex cursor-pointer items-center gap-6 rounded-[60px] bg-surface-container-lowest/70 p-2 pr-8 shadow-lg backdrop-blur-2xl transition-all duration-500 hover:bg-surface-container-lowest silk-border"
          >
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white/50 shadow-sm">
              <ImageWithFallback
                src={IMAGES.editorial.brief}
                className="h-full w-full object-cover"
                alt="Brief cover"
              />
            </div>
            <div className="flex-grow py-2">
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="scale-75 text-primary" fill="currentColor" />
                <span className="text-xs uppercase tracking-[0.2em] text-outline">Latest Daily Brief</span>
              </div>
              <h2 className="text-2xl leading-tight text-on-background">
                Your morning distillation: 8 vital insights for a Wednesday morning.
              </h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-inverse-surface text-white transition-transform duration-300 group-hover:scale-110">
              <Play className="h-5 w-5" fill="currentColor" />
            </div>
          </div>
        </section>

        <div className="mb-8 flex items-center justify-between px-4">
          <h3 className="text-3xl italic">Top Narratives</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('today')}
              className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-widest transition-all ${
                viewMode === 'today'
                  ? 'bg-secondary-container text-on-secondary-container silk-border'
                  : 'bg-transparent text-outline hover:bg-surface-container-low'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('global')}
              className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-widest transition-all ${
                viewMode === 'global'
                  ? 'bg-secondary-container text-on-secondary-container silk-border'
                  : 'bg-transparent text-outline hover:bg-surface-container-low'
              }`}
            >
              Global
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {displayedArticles.map((article, index) => {
            const imageSrc = index === 0 ? IMAGES.editorial.economy : IMAGES.editorial.technology;
            const shapeClass = index === 0 ? 'liquid-pill' : 'liquid-pill-alt';

            return (
              <article key={article.id} className="flex flex-col gap-6">
                <div
                  onClick={() => navigate(`/article/${article.id}`)}
                  className={`group relative h-[400px] w-full cursor-pointer overflow-hidden shadow-xl ${shapeClass} silk-border`}
                >
                  <ImageWithFallback
                    src={imageSrc}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={article.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="mb-4 flex flex-wrap gap-1">
                      <div className="flex -space-x-2">
                        {article.sources.slice(0, 10).map((source, sourceIndex) => (
                          <div
                            key={`${article.id}-${source}-${sourceIndex}`}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-surface-container-high bg-white"
                          >
                            <span className="text-[8px] font-bold text-on-surface">{source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <h4 className="text-3xl leading-tight text-white">{article.title}</h4>
                  </div>
                </div>

                <div className="cursor-pointer px-4" onClick={() => navigate(`/article/${article.id}`)}>
                  <p className="mb-4 leading-relaxed text-on-surface-variant opacity-80">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-outline">
                    <span>{article.category}</span>
                    <span>&middot;</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!hasAdFree && (
          <div className="mt-12">
            <AdCard />
          </div>
        )}

        <section className="mb-20 mt-20">
          <div className="relative overflow-hidden rounded-[50px] bg-surface-container-low p-12 text-center silk-border">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-3xl" />
            <span className="mb-6 block text-5xl text-outline opacity-30">&ldquo;</span>
            <blockquote className="mx-auto mb-8 max-w-2xl text-4xl italic leading-tight text-on-background">
              "Truth is not a destination, but a distillation of perspectives."
            </blockquote>
            <cite className="text-xs uppercase tracking-[0.3em] text-outline not-italic">
              &mdash; The Curator Editorial Board
            </cite>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
