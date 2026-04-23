import { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const regions = [
  { code: 'en-US', name: 'English (United States)', region: 'United States', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (United Kingdom)', region: 'United Kingdom', flag: '🇬🇧' },
  { code: 'en-IN', name: 'English (India)', region: 'India', flag: '🇮🇳' },
];

export function LanguageRegion() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success } = useToast();
  
  // Load saved language preference
  const [selectedRegion, setSelectedRegion] = useState(() => {
    const saved = localStorage.getItem('curator_language');
    return saved || 'en-US';
  });
  
  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  const handleRegionSelect = (code: string) => {
    setSelectedRegion(code);
    localStorage.setItem('curator_language', code);
    
    // Update preferences in localStorage
    const preferences = JSON.parse(localStorage.getItem('curator_preferences') || '{}');
    const selectedLang = regions.find(l => l.code === code);
    preferences.language = selectedLang?.name || 'English (United States)';
    localStorage.setItem('curator_preferences', JSON.stringify(preferences));
    
    success('Region preference updated');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-6 px-6">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          {/* Title */}
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center">
              Language & Region
            </h1>
          </div>
        </div>
      </header>
      
      <main className="pt-32 px-6 max-w-3xl mx-auto">
        <p className="text-on-surface-variant text-center mb-8 px-4">
          Select your preferred region for The Curator experience
        </p>
        
        {/* Region List */}
        <div className="space-y-3">
          {regions.map((region) => (
            <button
              key={region.code}
              onClick={() => handleRegionSelect(region.code)}
              className={`w-full bg-surface-container-lowest/70 backdrop-blur-xl border rounded-[30px] p-6 flex items-center justify-between hover:bg-surface-container-low transition-all ${
                selectedRegion === region.code
                  ? 'border-primary'
                  : 'border-outline-variant/15'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">
                  {region.flag}
                </div>
                <div className="text-left">
                  <div className="text-on-surface font-medium text-lg mb-1">
                    {region.name}
                  </div>
                  <div className="text-outline text-sm">
                    {region.region}
                  </div>
                </div>
              </div>
              
              {selectedRegion === region.code && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Info Box */}
        <div className="mt-8 bg-primary-container/30 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-6">
          <h3 className="font-[family-name:var(--font-headline)] text-lg text-on-surface mb-2">
            About Regional Settings
          </h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Your region preference helps customize date formats, spelling conventions (US vs UK English), and content relevance. All articles are available in English across all regions.
          </p>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}