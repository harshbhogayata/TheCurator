import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, Check, CreditCard, Crown, Sparkles, Star } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AppShell } from '../components/AppShell';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../../lib/query-keys';
import { isMockBackend, isMockPremium } from '../../lib/dev-mode';
import {
  exchangeMobileHandoff,
  parseDonatePlan,
  type DonatePlanId,
} from '../../lib/mobile-handoff';

interface SubscriptionPlan {
  id: 'basic' | 'premium' | 'lifetime';
  name: string;
  price: number;
  period: 'monthly' | 'onetime';
  description: string;
  benefits: string[];
  icon: typeof Sparkles;
  popular?: boolean;
}

export function Donate() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { tier: currentTier, upgradeTier } = useSubscription();
  const { isAuthenticated, authStatus } = useAuth();
  const fromApp = searchParams.get('source') === 'app';
  const [selectedPlan, setSelectedPlan] = useState<string>(
    () => parseDonatePlan(searchParams.get('plan')) ?? 'premium',
  );
  const [showThankYou, setShowThankYou] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [handoffStatus, setHandoffStatus] = useState<'exchanging' | 'ready' | 'error'>(() =>
    searchParams.get('handoff') ? 'exchanging' : 'ready',
  );
  const autoStartedRef = useRef(false);

  // Returning from checkout (?status=success) — Stripe redirect or Razorpay callback URL.
  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;
    setSearchParams({}, { replace: true });
    if (status === 'success') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all });
      setShowThankYou(true);
      const timer = setTimeout(() => {
        setShowThankYou(false);
        navigate('/brief');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams, queryClient, navigate]);

  // Pre-select plan from ?plan= (mobile deep link).
  useEffect(() => {
    const parsed = parseDonatePlan(searchParams.get('plan'));
    if (parsed) setSelectedPlan(parsed);
  }, [searchParams]);

  // Mobile → web auth handoff (?handoff=).
  useEffect(() => {
    const handoff = searchParams.get('handoff');
    if (!handoff) return;

    let cancelled = false;
    setHandoffStatus('exchanging');

    void exchangeMobileHandoff(handoff)
      .then(() => {
        if (cancelled) return;
        setHandoffStatus('ready');
        const next = new URLSearchParams(searchParams);
        next.delete('handoff');
        setSearchParams(next, { replace: true });
      })
      .catch(() => {
        if (!cancelled) setHandoffStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams]);
  
  const plans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 5,
      period: 'monthly',
      description: 'Essential features for casual readers',
      icon: Sparkles,
      benefits: [
        'Ad-free reading experience',
        'Early access to daily briefs',
        'Monthly newsletter',
        'Save up to 50 articles'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 15,
      period: 'monthly',
      description: 'Complete access for serious readers',
      icon: Crown,
      benefits: [
        'Everything in Basic',
        'Audio versions of all articles',
        'Community forum access',
        'Unlimited saves & collections',
        'Exclusive source insights'
      ],
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 299,
      period: 'onetime',
      description: 'One-time payment, lifetime access',
      icon: Star,
      benefits: [
        'Everything in Premium',
        'Lifetime access - pay once',
        'All future features included',
        'Priority support',
        'Recognition in credits'
      ]
    }
  ];
  
  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const isCurrentOrLower = (planId: string) => {
    if (currentTier === 'lifetime') return true;
    if (currentTier === 'premium' && (planId === 'basic' || planId === 'premium')) return true;
    if (currentTier === 'basic' && planId === 'basic') return true;
    return false;
  };
  
  const handleSubscribe = async (planOverride?: DonatePlanId) => {
    const plan = planOverride ?? (parseDonatePlan(selectedPlan) as DonatePlanId | null);
    if (!plan || isRedirecting) return;
    setCheckoutError(null);
    setIsRedirecting(true);
    try {
      await upgradeTier(plan);
      if (isMockBackend || isMockPremium) {
        setShowThankYou(true);
        setTimeout(() => {
          setShowThankYou(false);
          navigate('/brief');
        }, 3000);
      } else {
        await queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.all });
        setShowThankYou(true);
        setIsRedirecting(false);
        setTimeout(() => {
          setShowThankYou(false);
          navigate('/brief');
        }, 3000);
      }
    } catch {
      setCheckoutError('Unable to start checkout right now. Please try again.');
      setIsRedirecting(false);
      autoStartedRef.current = false;
    }
  };

  // Auto-open Razorpay when arriving from the app with ?auto=1.
  useEffect(() => {
    if (searchParams.get('auto') !== '1') return;
    if (handoffStatus !== 'ready') return;
    if (authStatus === 'loading' || !isAuthenticated) return;
    if (autoStartedRef.current || isRedirecting || showThankYou) return;

    const plan =
      parseDonatePlan(searchParams.get('plan')) ?? parseDonatePlan(selectedPlan);
    if (!plan || isCurrentOrLower(plan)) return;

    autoStartedRef.current = true;
    void handleSubscribe(plan);
  }, [
    handoffStatus,
    authStatus,
    isAuthenticated,
    isRedirecting,
    showThankYou,
    searchParams,
    selectedPlan,
    currentTier,
  ]);
  
  if (showThankYou) {
    return (
      <AppShell title="Subscription">
        <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary">
            <Heart className="h-12 w-12 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="font-[family-name:var(--font-headline)] text-4xl text-on-surface">Thank you!</h1>
          <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
            Your subscription to {selectedPlanData?.name} is now active.
          </p>
        </div>
      </AppShell>
    );
  }
  
  if (currentTier === 'lifetime' || currentTier === 'premium') {
    return (
      <AppShell title="Subscription">
        <div className="mx-auto max-w-2xl py-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-container">
            <Crown className="h-12 w-12 text-on-primary-container" />
          </div>
          <h2 className="font-[family-name:var(--font-headline)] text-4xl italic text-on-surface">You&apos;re all set!</h2>
          <p className="mt-4 text-lg text-on-surface-variant">
            You&apos;re currently a <strong className="capitalize">{currentTier}</strong> member with full premium access.
          </p>
          <button
            type="button"
            onClick={() => navigate('/brief')}
            className="mt-6 rounded-full bg-inverse-surface px-8 py-3 text-white hover:bg-primary"
          >
            Back to Briefs
          </button>
        </div>
      </AppShell>
    );
  }
  
  return (
    <AppShell title="Support Us">
      <div className="space-y-8">
        {/* Mobile app handoff */}
        {fromApp && handoffStatus === 'exchanging' && (
          <div className="mb-8 rounded-[30px] border border-outline-variant/15 bg-primary-container/50 p-4 text-center">
            <p className="text-on-primary-container">Signing you in from the Curator app…</p>
          </div>
        )}
        {handoffStatus === 'error' && (
          <div className="mb-8 rounded-[30px] border border-error/30 bg-error-container/30 p-4 text-center">
            <p className="text-on-error-container text-sm">
              Could not complete app sign-in. Sign in on this page to continue checkout.
            </p>
          </div>
        )}
        {fromApp && handoffStatus === 'ready' && !isRedirecting && (
          <div className="mb-8 rounded-[30px] border border-outline-variant/15 bg-primary-container/50 p-4 text-center">
            <p className="text-on-primary-container text-sm">
              Continuing from the Curator app — your{' '}
              <strong className="capitalize">{selectedPlan}</strong> plan is pre-selected.
            </p>
          </div>
        )}
        
        {/* Current Subscription Badge */}
        {currentTier === 'basic' && (
          <div className="mb-8 bg-primary-container/50 border border-outline-variant/15 rounded-[30px] p-4 text-center">
            <p className="text-on-primary-container">
              You're currently on <strong>Basic</strong> plan. Upgrade for more features!
            </p>
          </div>
        )}
        
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-container flex items-center justify-center">
            <Heart className="w-10 h-10 text-on-primary-container" />
          </div>
          <h2 className="font-[family-name:var(--font-headline)] text-4xl md:text-5xl text-on-surface mb-4 italic">
            Support Independent Journalism
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl mx-auto">
            No ads, no paywalls, no corporate influence. Just thoughtful, synthesized journalism funded by readers like you.
          </p>
        </section>
        
        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentTier === plan.id;
            const isLowerTier = isCurrentOrLower(plan.id) && !isCurrent;
            
            return (
              <button
                key={plan.id}
                onClick={() => !isLowerTier && setSelectedPlan(plan.id)}
                disabled={isLowerTier}
                className={`text-left bg-surface-container-lowest/70 backdrop-blur-xl border-2 rounded-[40px] p-8 transition-all relative ${
                  selectedPlan === plan.id
                    ? 'border-primary shadow-xl scale-105'
                    : 'border-outline-variant/15 hover:border-outline-variant/30'
                } ${isCurrent ? 'ring-2 ring-secondary' : ''} ${isLowerTier ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-secondary text-on-secondary px-3 py-1 rounded-full text-xs uppercase tracking-widest">
                    Current
                  </div>
                )}
                
                {selectedPlan === plan.id && !isLowerTier && (
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                    <Icon className="w-6 h-6 text-on-primary-container" />
                  </div>
                  <h3 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface">
                    {plan.name}
                  </h3>
                </div>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-on-surface">
                    ${plan.price}
                  </span>
                  <span className="text-outline text-sm ml-2">
                    {plan.period === 'monthly' ? '/ month' : 'one-time'}
                  </span>
                </div>
                
                <p className="text-on-surface-variant mb-6">
                  {plan.description}
                </p>
                
                <ul className="space-y-2">
                  {plan.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
        
        {/* Subscribe Button */}
        <div className="flex flex-col items-center gap-3">
          <button 
            onClick={() => void handleSubscribe()}
            disabled={!selectedPlan || isCurrentOrLower(selectedPlan) || isRedirecting}
            className="bg-inverse-surface text-white px-12 py-5 rounded-full uppercase tracking-widest transition-all shadow-xl hover:bg-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg"
          >
            <CreditCard className="w-6 h-6" />
            {isRedirecting
              ? 'Opening secure checkout…'
              : `Subscribe to ${selectedPlanData?.name} - $${selectedPlanData?.price}${
                  selectedPlanData?.period === 'monthly' ? '/mo' : ''
                }`}
          </button>
          {checkoutError && (
            <p className="text-sm text-error" role="alert">
              {checkoutError}
            </p>
          )}
        </div>
        
        {/* Impact Message */}
        <div className="mt-12 text-center bg-primary-container/50 rounded-[40px] p-8 border border-outline-variant/15">
          <p className="text-on-primary-container leading-relaxed">
            🌟 <strong>Your subscription matters.</strong> 100% of proceeds go directly to supporting our editorial team, expanding our source network, and keeping The Curator free from commercial influence.
          </p>
        </div>
      </div>
    </AppShell>
  );
}