import { useState } from 'react';
import { ArrowLeft, Heart, Check, CreditCard, Crown, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from '../components/BottomNav';
import { useSubscription } from '../context/SubscriptionContext';

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
  const { tier: currentTier, upgradeTier } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [showThankYou, setShowThankYou] = useState(false);
  
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
  
  const handleSubscribe = () => {
    if (selectedPlan) {
      upgradeTier(selectedPlan as 'basic' | 'premium' | 'lifetime');
    }
    
    setShowThankYou(true);
    setTimeout(() => {
      setShowThankYou(false);
      navigate('/home');
    }, 3000);
  };
  
  // Check if user already has this tier or better
  const isCurrentOrLower = (planId: string) => {
    if (currentTier === 'lifetime') return true;
    if (currentTier === 'premium' && (planId === 'basic' || planId === 'premium')) return true;
    if (currentTier === 'basic' && planId === 'basic') return true;
    return false;
  };
  
  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
            <Heart className="w-12 h-12 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="font-[family-name:var(--font-headline)] text-4xl text-on-surface mb-4">
            Thank You!
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-4">
            Your subscription to {selectedPlanData?.name} is now active! Enjoy all the premium features.
          </p>
        </div>
      </div>
    );
  }
  
  // If user has lifetime or premium, show a special message
  if (currentTier === 'lifetime' || currentTier === 'premium') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 pt-6 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-on-surface" />
              </button>
            </div>
            
            <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5">
              <h1 className="text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center">
                Subscription
              </h1>
            </div>
          </div>
        </header>
        
        <main className="pt-32 px-6 max-w-2xl mx-auto flex items-center justify-center min-h-[calc(100vh-12rem)]">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-container flex items-center justify-center">
              <Crown className="w-12 h-12 text-on-primary-container" />
            </div>
            <h2 className="font-[family-name:var(--font-headline)] text-4xl text-on-surface mb-4 italic">
              You're All Set!
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
              You're currently a <strong className="capitalize">{currentTier}</strong> member. You have access to all our premium features.
            </p>
            <button 
              onClick={() => navigate('/home')}
              className="bg-inverse-surface text-white px-8 py-3 rounded-full hover:bg-primary transition-all"
            >
              Back to Home
            </button>
          </div>
        </main>
        
        <BottomNav />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header with Separate Pill Containers */}
      <header className="fixed top-0 w-full z-50 pt-6 px-6">
        <div className="flex items-center gap-3">
          {/* Left: Back Button (Circle Pill) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          {/* Center: Title (Long Pill) */}
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center">
              Choose Your Plan
            </h1>
          </div>
        </div>
      </header>
      
      <main className="pt-32 px-6 max-w-5xl mx-auto">
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
        <div className="flex justify-center">
          <button 
            onClick={handleSubscribe}
            disabled={!selectedPlan || isCurrentOrLower(selectedPlan)}
            className="bg-inverse-surface text-white px-12 py-5 rounded-full uppercase tracking-widest transition-all shadow-xl hover:bg-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg"
          >
            <CreditCard className="w-6 h-6" />
            Subscribe to {selectedPlanData?.name} - ${selectedPlanData?.price}
            {selectedPlanData?.period === 'monthly' && '/mo'}
          </button>
        </div>
        
        {/* Impact Message */}
        <div className="mt-12 text-center bg-primary-container/50 rounded-[40px] p-8 border border-outline-variant/15">
          <p className="text-on-primary-container leading-relaxed">
            🌟 <strong>Your subscription matters.</strong> 100% of proceeds go directly to supporting our editorial team, expanding our source network, and keeping The Curator free from commercial influence.
          </p>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}