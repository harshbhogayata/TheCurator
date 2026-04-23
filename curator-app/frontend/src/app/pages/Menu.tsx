import { X, Home, Sparkles, Compass, Bookmark, Settings, User, Heart, Info, FileText, HelpCircle, LogOut, Search, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { IMAGES } from '../constants/images';

export function Menu() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { tier } = useSubscription();
  
  const menuItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Sparkles, label: 'Daily Briefs', path: '/brief' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Search, label: 'Search Articles', path: '/search' },
    { icon: Bookmark, label: 'Saved Articles', path: '/saved' },
    { icon: BarChart3, label: 'Reading Stats', path: '/reading-stats' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: User, label: 'Account', path: '/account' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: Heart, label: 'Support Us', path: '/donate' },
    { icon: Info, label: 'About The Curator', path: '/about' },
    { icon: FileText, label: 'Privacy Policy', path: '/privacy' },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ];
  
  const handleSignOut = () => {
    signOut();
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low">
      {/* Header with Separate Pill Containers */}
      <header className="fixed top-0 w-full z-50 pt-6 px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Title (Long Pill) */}
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-headline)] italic text-on-surface text-center">
              Menu
            </h1>
          </div>
          
          {/* Right: Close Button (Circle Pill) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate('/home')}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-on-surface" />
            </button>
          </div>
        </div>
      </header>
      
      <main className="pt-32 px-6 max-w-2xl mx-auto pb-8">
        {/* Profile Summary */}
        <div className="mb-8 bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-outline-variant/30 shadow-lg">
            <img
              src={user?.profileImage || IMAGES.profile.main}
              className="w-full h-full object-cover" 
              alt="Profile" 
            />
          </div>
          <div className="flex-1">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface">
              {user?.name || 'Guest User'}
            </h2>
            <p className="text-outline text-sm capitalize">{tier === 'free' ? 'Free' : tier} Member</p>
          </div>
          <button 
            onClick={() => navigate('/account')}
            className="text-primary text-sm hover:underline"
          >
            Edit Profile
          </button>
        </div>
        
        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="w-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-5 flex items-center gap-4 hover:bg-surface-container-low transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center group-hover:bg-primary-fixed transition-colors">
                <item.icon className="w-6 h-6 text-on-primary-container" />
              </div>
              <span className="text-on-surface font-medium text-lg">{item.label}</span>
            </button>
          ))}
        </nav>
        
        {/* Sign Out Button */}
        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="w-full bg-error/10 border border-error/20 rounded-[30px] p-5 flex items-center justify-center gap-3 hover:bg-error/20 transition-all group"
          >
            <LogOut className="w-5 h-5 text-error" />
            <span className="text-error font-medium text-lg">Sign Out</span>
          </button>
        </div>
      </main>
    </div>
  );
}