import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { IdentityProviderButtons } from '../components/IdentityProviderButtons';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useAuth } from '../context/AuthContext';
import { IMAGES } from '../constants/images';

export function Welcome() {
  const navigate = useNavigate();
  const { authStatus, onboarding, providerAvailability } = useAuth();
  const showIdentityProviders =
    providerAvailability.entra && (providerAvailability.google || providerAvailability.apple);

  useEffect(() => {
    // Do not route without permission:
    // if (authStatus === 'authenticated' && onboarding) {
    //   navigate(onboarding.completed ? '/home' : '/onboarding', { replace: true });
    // }
  }, [authStatus, navigate, onboarding]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="liquid-gradient fixed inset-0 z-0" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_80%_20%,_#e7e2d7_0%,_transparent_50%)] opacity-40 mix-blend-soft-light" />

      <main className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center overflow-y-auto p-6 md:p-12">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center gap-12 lg:flex-row lg:gap-20">
          <div className="flex w-full justify-center lg:w-1/2 lg:justify-end">
            <div className="relative h-[32rem] w-72 overflow-hidden rounded-[12rem] shadow-2xl transition-transform duration-700 hover:scale-[1.02] md:h-[40rem] md:w-80 silk-border">
              <ImageWithFallback
                src={IMAGES.hero.welcome}
                alt="Abstract glass sculptures catching light"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-container/40" />
            </div>
          </div>

          <div className="flex w-full flex-col items-center space-y-8 text-center lg:w-1/2 lg:items-start lg:text-left">
            <div className="inline-block">
              <span className="text-3xl italic tracking-tight text-on-surface">The Curator</span>
            </div>

            <div className="max-w-md space-y-4">
              <h1 className="text-5xl font-light italic leading-[1.1] tracking-tight text-on-surface md:text-7xl">
                The World, <br />Distilled.
              </h1>
              <p className="text-lg font-light leading-relaxed text-on-surface-variant">
                Experience journalism beyond the noise. Our synthesis brings the most
                important viewpoints into one calm, essential narrative.
              </p>
            </div>

            <div className="flex w-full max-w-md flex-col gap-4 pt-4 sm:flex-row">
              <button
                onClick={() => navigate('/sign-up')}
                className="group flex flex-1 items-center justify-center gap-2 rounded-full bg-inverse-surface px-10 py-5 font-semibold tracking-wide text-surface shadow-xl transition-all duration-300 hover:bg-zinc-800 active:scale-95"
              >
                Get Started
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate('/sign-in')}
                className="flex-1 rounded-full border border-outline-variant/15 bg-surface-container-lowest/30 px-10 py-5 font-medium tracking-wide text-on-surface shadow-sm backdrop-blur-3xl transition-all duration-300 hover:bg-surface-container-lowest/50 active:scale-95"
              >
                Sign In
              </button>
            </div>

            {showIdentityProviders && (
              <div className="w-full max-w-md space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-background px-4 text-outline">or continue instantly</span>
                  </div>
                </div>
                <IdentityProviderButtons mode="signin" />
              </div>
            )}

            <div className="flex items-center gap-6 pt-6">
              <div className="flex -space-x-3">
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-surface bg-zinc-200">
                  <ImageWithFallback
                    src={IMAGES.profile.main}
                    className="h-full w-full rounded-full object-cover"
                    alt="User profile"
                  />
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-surface bg-zinc-300">
                  <ImageWithFallback
                    src={IMAGES.profile.woman}
                    className="h-full w-full rounded-full object-cover"
                    alt="User profile"
                  />
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-surface bg-zinc-400">
                  <ImageWithFallback
                    src={IMAGES.profile.casual}
                    className="h-full w-full rounded-full object-cover"
                    alt="User profile"
                  />
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  Trusted by
                </p>
                <p className="text-sm text-outline">12k+ Curious Minds</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 hidden w-full max-w-xs px-10 md:block">
          <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-outline-variant/10">
            <div className="absolute inset-y-0 left-0 w-1/4 rounded-full bg-gradient-to-r from-primary to-primary-fixed-dim" />
          </div>
          <div className="mt-3 flex justify-between px-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">Philosophy</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">01 / 04</span>
          </div>
        </div>
      </main>
    </div>
  );
}
