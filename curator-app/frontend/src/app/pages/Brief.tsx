import { useCallback, useState } from 'react';
import { Play, Pause, Lock, Sparkles, Quote } from 'lucide-react';
import { useNavigate } from 'react-router';

import { AppShell } from '../components/AppShell';
import { AdBanner } from '../components/AdBanner';
import { PaywallModal } from '../components/PaywallModal';
import { BriefCardSkeleton } from '../components/SkeletonLoaders';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useSubscription } from '../context/SubscriptionContext';
import { useAudio } from '../context/AudioContext';
import { useBriefs } from '../../hooks/use-briefs';
import { organicShapeStyle } from '../../lib/layout';
import { shape } from '../../ui/tokens/spacing';

const EDITORIAL_QUOTE = 'Truth is not a destination, but a distillation of perspectives.';
const EDITORIAL_ATTRIBUTION = '— The Curator Editorial Board';

export function Brief() {
  const navigate = useNavigate();
  const { isAuthenticated } = useRequireAuth();
  const { hasAdFree, hasAudioAccess } = useSubscription();
  const { playBrief, pauseBrief, resumeBrief, audioState } = useAudio();
  const { data: briefs = [], isLoading, isError, refetch } = useBriefs();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  if (!isAuthenticated) {
    return null;
  }

  const featuredBrief = briefs[0];
  const moreBriefs = briefs.slice(1);

  const handlePlay = (id: string, audioUrl: string) => {
    if (!hasAudioAccess) {
      setPaywallOpen(true);
      return;
    }

    if (audioState.currentBriefId === id && audioState.isPlaying) {
      pauseBrief();
    } else if (audioState.currentBriefId === id) {
      resumeBrief();
    } else {
      playBrief(id, audioUrl);
    }
  };

  return (
    <AppShell title="Briefs" archetype="feed">
      <div className="space-y-8">
        {!hasAdFree && <AdBanner position="top" />}

        {!hasAudioAccess && (
          <div
            className="flex gap-4 border border-outline-variant/15 bg-primary-container/50 p-6"
            style={{ borderRadius: '60px 30px 70px 40px' }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-headline)] text-xl text-on-surface">Unlock Audio Briefs</h3>
              <p className="mt-2 text-on-surface-variant">
                Subscribe to Premium to listen to audio versions of all articles and briefs.
              </p>
              <button
                type="button"
                onClick={() => navigate('/donate')}
                className="mt-3 rounded-full bg-inverse-surface px-6 py-2 text-sm text-inverse-on-surface hover:bg-primary"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {isError ? (
          <div className="rounded-[40px] border border-outline-variant/15 bg-surface-container-low p-10 text-center">
            <p className="text-on-surface-variant">Briefs could not load.</p>
            <button type="button" onClick={onRefresh} className="mt-4 text-primary hover:underline">
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-6">
            <BriefCardSkeleton />
            <BriefCardSkeleton />
            <BriefCardSkeleton />
          </div>
        ) : briefs.length === 0 ? (
          <div className="py-20 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-outline-variant" />
            <h2 className="mt-4 font-[family-name:var(--font-headline)] text-2xl text-on-surface">No briefs available</h2>
            <p className="mt-2 text-on-surface-variant">We&apos;ll notify you when new curated briefings are ready.</p>
          </div>
        ) : (
          <>
            <section
              className="border border-outline-variant/15 bg-surface-container-lowest/70 p-6 backdrop-blur-xl sm:p-8"
              style={organicShapeStyle(shape.imageHero)}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-2">
                <Sparkles className="h-4 w-4 text-primary-foreground" fill="currentColor" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground">Today&apos;s Featured</span>
              </div>

              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-outline-variant/30 shadow-lg sm:h-32 sm:w-32">
                  <img src={featuredBrief.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="font-[family-name:var(--font-headline)] text-2xl leading-tight text-on-background sm:text-3xl">
                    {featuredBrief.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-outline md:justify-start">
                    <span>{featuredBrief.duration}</span>
                    <span>•</span>
                    <span>{featuredBrief.insights} insights</span>
                  </div>
                  {!hasAudioAccess && (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-on-surface-variant">{featuredBrief.summary}</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => handlePlay(featuredBrief.id, featuredBrief.audioUrl)}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-inverse-surface text-inverse-on-surface shadow-xl transition-transform hover:scale-105"
                >
                  {!hasAudioAccess ? (
                    <Lock className="h-6 w-6" />
                  ) : audioState.currentBriefId === featuredBrief.id && audioState.isPlaying ? (
                    <Pause className="h-7 w-7" fill="currentColor" />
                  ) : (
                    <Play className="ml-1 h-7 w-7" fill="currentColor" />
                  )}
                </button>
              </div>
            </section>

            {!hasAdFree && <AdBanner position="inline" />}

            <section>
              <h3 className="mb-6 px-1 font-[family-name:var(--font-headline)] text-2xl italic text-on-surface">More Briefs</h3>
              <div className="space-y-3">
                {moreBriefs.map((brief) => {
                  const isPlaying = audioState.currentBriefId === brief.id && audioState.isPlaying;
                  return (
                    <button
                      key={brief.id}
                      type="button"
                      onClick={() => handlePlay(brief.id, brief.audioUrl)}
                      className="flex w-full items-center gap-4 border border-outline-variant/15 bg-surface-container-lowest/70 p-4 text-left transition-shadow hover:shadow-lg"
                      style={{ borderRadius: '60px 30px 70px 40px' }}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-inverse-surface text-inverse-on-surface">
                        {!hasAudioAccess ? (
                          <Lock className="h-4 w-4" />
                        ) : isPlaying ? (
                          <Pause className="h-5 w-5" fill="currentColor" />
                        ) : (
                          <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                        )}
                      </div>
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-outline-variant/20">
                        <img src={brief.imageUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-outline">{brief.category}</div>
                        <h4 className="line-clamp-2 font-[family-name:var(--font-headline)] text-lg text-on-surface">{brief.title}</h4>
                        <div className="mt-1 flex gap-2 text-xs text-outline">
                          <span>{brief.duration}</span>
                          <span>•</span>
                          <span>{brief.publishedDate}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              className="relative overflow-hidden border border-outline-variant/15 bg-surface-container-low p-10 text-center"
              style={{ borderRadius: '50px' }}
            >
              <Quote className="mx-auto mb-6 h-12 w-12 text-outline opacity-30" />
              <blockquote className="mx-auto max-w-2xl font-[family-name:var(--font-headline)] text-2xl italic leading-tight text-on-background sm:text-3xl">
                &ldquo;{EDITORIAL_QUOTE}&rdquo;
              </blockquote>
              <cite className="mt-6 block text-xs uppercase tracking-[0.3em] text-outline not-italic">
                {EDITORIAL_ATTRIBUTION}
              </cite>
            </section>
          </>
        )}

        {refreshing && <p className="text-center text-xs text-outline">Refreshing…</p>}
      </div>

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        feature="Audio Briefs"
        description="Get instant access to audio versions of all articles and daily briefs."
        requiredTier="premium"
      />
    </AppShell>
  );
}
