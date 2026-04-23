import { useState, useEffect } from 'react';
import { Menu, User, Bell, Palette, Globe, Lock, CreditCard, Heart, LogOut, ChevronRight, Crown, Sun, Moon, Monitor, Check } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import { IMAGES } from '../constants/images';

interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  weeklyDigest: boolean;
  darkMode: boolean;
  language: string;
}

export function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { tier, isSubscribed, cancelSubscription } = useSubscription();
  const { theme, setTheme } = useTheme();
  
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  
  // Prevent scrolling when theme dialog is open
  useEffect(() => {
    if (showThemeDialog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showThemeDialog]);
  
  // Load preferences from localStorage
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('curator_preferences');
    return saved ? JSON.parse(saved) : {
      notifications: true,
      emailUpdates: true,
      weeklyDigest: false,
      darkMode: false,
      language: 'English (United States)'
    };
  });
  
  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('curator_preferences', JSON.stringify(preferences));
  }, [preferences]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  const togglePreference = (key: keyof UserPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleSignOut = () => {
    signOut();
    navigate('/');
  };
  
  const handleCancelSubscription = () => {
    cancelSubscription();
    navigate('/home');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header with Separate Pill Containers */}
      <header className="fixed top-0 w-full z-50 pt-6 px-6">
        <div className="flex justify-between items-center gap-3">
          {/* Left: Menu Button (Circle Pill) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate('/menu')}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <Menu className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          {/* Center: Title (Long Pill) */}
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center">
              Settings
            </h1>
          </div>
          
          {/* Right: Badge + Profile (Pill Container) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-4 py-2 flex items-center gap-3">
            <SubscriptionBadge size="sm" />
            <div 
              className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/15 cursor-pointer"
              onClick={() => navigate('/account')}
            >
              <img 
                src={user?.profileImage || IMAGES.profile.main}
                className="w-full h-full object-cover" 
                alt="User profile" 
              />
            </div>
          </div>
        </div>
      </header>
      
      <main className="pt-32 px-6 max-w-3xl mx-auto">
        {/* Subscription Status */}
        {isSubscribed && (
          <section className="mb-8">
            <div className="bg-primary-container/50 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-[family-name:var(--font-headline)] text-xl text-on-surface capitalize">
                      {tier} Member
                    </h3>
                    <p className="text-sm text-on-surface-variant">Active subscription</p>
                  </div>
                </div>
                <SubscriptionBadge tier={tier} size="md" />
              </div>
              
              <div className="flex gap-3">
                {/* Only show upgrade button for basic tier */}
                {tier === 'basic' && (
                  <button 
                    onClick={() => navigate('/donate')}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-full text-sm transition-all"
                  >
                    Upgrade Tier
                  </button>
                )}
                {/* Only show cancel for monthly subscriptions (not lifetime) */}
                {tier !== 'lifetime' && (
                  <button 
                    onClick={() => setShowCancelDialog(true)}
                    className={`${tier === 'basic' ? 'flex-1' : 'w-full'} bg-surface-container hover:bg-surface-container-high text-on-surface py-3 px-4 rounded-full text-sm transition-all`}
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
        
        {/* Account Section */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-headline)] text-xl italic text-on-surface mb-4 px-2">
            Account
          </h2>
          
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/account')}
              className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center justify-between hover:bg-surface-container-low transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                  <User className="w-6 h-6 text-on-primary-container" />
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium">Profile & Account</div>
                  <div className="text-outline text-sm">Manage your personal information</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              onClick={() => navigate('/donate')}
              className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center justify-between hover:bg-surface-container-low transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
                  <Heart className="w-6 h-6 text-on-secondary-container" />
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium">Support The Curator</div>
                  <div className="text-outline text-sm">Donate to keep journalism independent</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
        
        {/* Preferences Section */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-headline)] text-xl italic text-on-surface mb-4 px-2">
            Preferences
          </h2>
          
          <div className="space-y-3">
            {/* Notifications Toggle */}
            <div className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary-container flex items-center justify-center">
                  <Bell className="w-6 h-6 text-on-tertiary-container" />
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium">Notifications</div>
                  <div className="text-outline text-sm">Daily briefs and updates</div>
                </div>
              </div>
              <button 
                onClick={() => togglePreference('notifications')}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  preferences.notifications ? 'bg-primary' : 'bg-surface-container-high'
                }`}
                aria-label={`Turn notifications ${preferences.notifications ? 'off' : 'on'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-surface-container-lowest rounded-full shadow-md transition-transform ${
                  preferences.notifications ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
            
            {/* Email Updates Toggle */}
            <div className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                  <Bell className="w-6 h-6 text-on-primary-container" />
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium">Email Updates</div>
                  <div className="text-outline text-sm">Receive article highlights via email</div>
                </div>
              </div>
              <button 
                onClick={() => togglePreference('emailUpdates')}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  preferences.emailUpdates ? 'bg-primary' : 'bg-surface-container-high'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-surface-container-lowest rounded-full shadow-md transition-transform ${
                  preferences.emailUpdates ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
            
            {/* Weekly Digest Toggle */}
            <div className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
                  <Bell className="w-6 h-6 text-on-secondary-container" />
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium">Weekly Digest</div>
                  <div className="text-outline text-sm">Sunday roundup of top narratives</div>
                </div>
              </div>
              <button 
                onClick={() => togglePreference('weeklyDigest')}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  preferences.weeklyDigest ? 'bg-primary' : 'bg-surface-container-high'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-surface-container-lowest rounded-full shadow-md transition-transform ${
                  preferences.weeklyDigest ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
            
            <button 
              onClick={() => setShowThemeDialog(true)}
              className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center justify-between hover:bg-surface-container-low transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                  <Palette className="w-6 h-6 text-on-primary-container" />
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium">Appearance</div>
                  <div className="text-outline text-sm capitalize">{theme} theme</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              onClick={() => navigate('/language-region')}
              className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center justify-between hover:bg-surface-container-low transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center">
                  <Globe className="w-6 h-6 text-on-secondary-container" />
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium">Language & Region</div>
                  <div className="text-outline text-sm">{preferences.language}</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
        
        {/* Security Section */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-headline)] text-xl italic text-on-surface mb-4 px-2">
            Security & Privacy
          </h2>
          
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/privacy')}
              className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center justify-between hover:bg-surface-container-low transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary-container flex items-center justify-center">
                  <Lock className="w-6 h-6 text-on-tertiary-container" />
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium">Privacy Policy</div>
                  <div className="text-outline text-sm">View our privacy policy</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
              onClick={() => navigate('/connected-accounts')}
              className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center justify-between hover:bg-surface-container-low transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-on-primary-container" />
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium">Connected Accounts</div>
                  <div className="text-outline text-sm">Manage linked services</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-outline group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>
        
        {/* Sign Out */}
        <div className="flex justify-center pt-4">
          <button 
            onClick={() => setShowSignOutDialog(true)}
            className="bg-error/90 hover:bg-error text-on-error px-10 py-4 rounded-full uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </main>
      
      <BottomNav />
      
      {/* Sign Out Dialog */}
      <ConfirmDialog 
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={handleSignOut}
        title="Sign Out?"
        description="Are you sure you want to sign out of your account? You'll need to sign in again to access your saved articles and preferences."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        variant="danger"
      />
      
      {/* Cancel Subscription Dialog */}
      <ConfirmDialog 
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription?"
        description={`Are you sure you want to cancel your ${tier} subscription? You'll lose access to premium features including ad-free reading${tier === 'premium' ? ', audio briefs, and unlimited saves' : ''}.`}
        confirmText="Cancel Subscription"
        cancelText="Keep Subscription"
        variant="warning"
      />
      
      {/* Theme Selection Dialog */}
      {showThemeDialog && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6"
          onClick={() => setShowThemeDialog(false)}
        >
          <div 
            className="bg-surface-container-lowest p-8 max-w-md w-full shadow-2xl rounded-[40px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-3 text-center">
              Choose Theme
            </h3>
            <p className="text-outline text-center mb-8">
              Select your preferred appearance
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  setTheme('light');
                  setShowThemeDialog(false);
                }}
                className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${
                  theme === 'light'
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container border-outline-variant/20 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    theme === 'light' ? 'bg-primary-foreground' : 'bg-primary/10'
                  }`}>
                    <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-primary' : 'text-on-surface'}`} />
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${theme === 'light' ? 'text-primary-foreground' : 'text-on-surface'}`}>
                      Light
                    </div>
                    <div className={`text-sm ${theme === 'light' ? 'text-primary-foreground/80' : 'text-outline'}`}>
                      Bright & crisp
                    </div>
                  </div>
                </div>
                {theme === 'light' && (
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
              
              <button
                onClick={() => {
                  setTheme('dark');
                  setShowThemeDialog(false);
                }}
                className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${
                  theme === 'dark'
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container border-outline-variant/20 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    theme === 'dark' ? 'bg-primary-foreground' : 'bg-primary/10'
                  }`}>
                    <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-primary' : 'text-on-surface'}`} />
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${theme === 'dark' ? 'text-primary-foreground' : 'text-on-surface'}`}>
                      Dark
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-primary-foreground/80' : 'text-outline'}`}>
                      Easy on eyes
                    </div>
                  </div>
                </div>
                {theme === 'dark' && (
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
              
              <button
                onClick={() => {
                  setTheme('system');
                  setShowThemeDialog(false);
                }}
                className={`w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between ${
                  theme === 'system'
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container border-outline-variant/20 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    theme === 'system' ? 'bg-primary-foreground' : 'bg-primary/10'
                  }`}>
                    <Monitor className={`w-6 h-6 ${theme === 'system' ? 'text-primary' : 'text-on-surface'}`} />
                  </div>
                  <div className="text-left">
                    <div className={`font-medium ${theme === 'system' ? 'text-primary-foreground' : 'text-on-surface'}`}>
                      Auto
                    </div>
                    <div className={`text-sm ${theme === 'system' ? 'text-primary-foreground/80' : 'text-outline'}`}>
                      Match device
                    </div>
                  </div>
                </div>
                {theme === 'system' && (
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
            </div>
            
            <button
              onClick={() => setShowThemeDialog(false)}
              className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-4 px-6 rounded-full transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
