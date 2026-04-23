import { useState, useEffect } from 'react';
import { Menu, Trash2, Bookmark, FolderPlus, Lock } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ArticleCard } from '../components/ArticleCard';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { PaywallModal } from '../components/PaywallModal';
import { AddToCollectionModal } from '../components/AddToCollectionModal';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useToast } from '../components/Toast';
import type { Article } from '../data/articles';
import { IMAGES } from '../constants/images';

export function Saved() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { savedArticles, savedCount, unsaveArticle } = useSavedArticles();
  const { hasUnlimitedSaves, maxSaves } = useSubscription();
  const { success } = useToast();
  const [showCollectionPaywall, setShowCollectionPaywall] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');
  const [filteredArticles, setFilteredArticles] = useState(savedArticles);
  
  // Calculate percentage and remaining saves
  const percentUsed = maxSaves === Infinity ? 0 : Math.round((savedCount / maxSaves) * 100);
  const remainingSaves = maxSaves === Infinity ? Infinity : maxSaves - savedCount;

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const filtered = savedArticles.filter(article => 
      article.title.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredArticles(filtered);
  }, [filterText, savedArticles]);
  
  if (!isAuthenticated) {
    return null;
  }

  const handleDelete = (articleId: string) => {
    unsaveArticle(articleId);
    selectedArticles.delete(articleId);
    setSelectedArticles(new Set(selectedArticles));
    success('Article removed from saved');
  };

  const handleBulkDelete = () => {
    selectedArticles.forEach(id => unsaveArticle(id));
    setSelectedArticles(new Set());
    success('Articles removed from saved');
  };

  const toggleArticleSelection = (articleId: string) => {
    const newSelection = new Set(selectedArticles);
    if (newSelection.has(articleId)) {
      newSelection.delete(articleId);
    } else {
      newSelection.add(articleId);
    }
    setSelectedArticles(newSelection);
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
              Saved
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

      <main className="pt-32 px-6 max-w-5xl mx-auto">
        {/* Storage Limit Banner */}
        {!hasUnlimitedSaves && (
          <div className={`mb-8 rounded-[40px] p-6 border ${
            percentUsed >= 90 
              ? 'bg-error-container/50 border-error' 
              : percentUsed >= 70 
                ? 'bg-tertiary-container/50 border-outline-variant/15'
                : 'bg-surface-container-lowest/70 border-outline-variant/15'
          } backdrop-blur-xl`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-on-surface">
                  {percentUsed >= 90 ? '⚠️ Almost Full' : `${savedCount} of ${maxSaves} Articles Saved`}
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  {remainingSaves === Infinity ? 'Unlimited' : `${remainingSaves} ${remainingSaves === 1 ? 'slot' : 'slots'} remaining`}
                </p>
              </div>
              {percentUsed >= 70 && (
                <button 
                  onClick={() => navigate('/donate')}
                  className="bg-inverse-surface text-white px-4 py-2 rounded-full text-sm hover:bg-primary transition-all"
                >
                  Upgrade
                </button>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  percentUsed >= 90 ? 'bg-error' : percentUsed >= 70 ? 'bg-tertiary' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Collections CTA */}
        <div className="mb-8 bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
            {hasUnlimitedSaves ? (
              <FolderPlus className="w-6 h-6 text-on-secondary-container" />
            ) : (
              <Lock className="w-6 h-6 text-on-secondary-container" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-[family-name:var(--font-headline)] text-xl text-on-surface mb-2">
              {hasUnlimitedSaves ? 'Organize with Collections' : 'Unlock Collections'}
            </h3>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              {hasUnlimitedSaves 
                ? 'Create custom collections to organize your saved articles by topic, project, or interest.'
                : 'Upgrade to Premium tier to create unlimited collections and organize your reading list.'
              }
            </p>
            <button 
              onClick={() => hasUnlimitedSaves ? navigate('/collections') : setShowCollectionPaywall(true)}
              className="text-primary text-sm hover:underline"
            >
              {hasUnlimitedSaves ? 'Manage Collections →' : 'Learn More'}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedArticles.size > 0 && (
          <div className="mb-6 bg-inverse-surface text-white rounded-[30px] p-4 flex items-center justify-between">
            <span className="font-medium">
              {selectedArticles.size} {selectedArticles.size === 1 ? 'article' : 'articles'} selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedArticles(new Set())}
                className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-full bg-error hover:bg-error/90 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Filter Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Filter articles..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full px-4 py-2 rounded-full bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 text-on-surface"
          />
        </div>

        {/* Saved Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-16 text-center">
            <Bookmark className="w-16 h-16 mx-auto mb-4 text-outline" />
            <h2 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-3">
              No Saved Articles Yet
            </h2>
            <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
              Start saving articles you want to read later. Tap the bookmark icon on any article.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="bg-inverse-surface text-white px-8 py-3 rounded-full hover:bg-primary transition-all"
            >
              Explore Articles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {filteredArticles.map((article) => (
              <div key={article.id} className="relative">
                {/* Selection Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <button
                    onClick={() => toggleArticleSelection(article.id)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedArticles.has(article.id)
                        ? 'bg-primary border-primary'
                        : 'bg-surface-container border-outline-variant hover:border-primary'
                    }`}
                  >
                    {selectedArticles.has(article.id) && (
                      <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Delete Button */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="w-8 h-8 rounded-full bg-error text-error-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      <PaywallModal 
        isOpen={showCollectionPaywall}
        onClose={() => setShowCollectionPaywall(false)}
        feature="Collections"
        description="Create unlimited custom collections to organize your saved articles by topic, project, or reading list. Available for Premium tier and above."
        requiredTier="premium"
      />
    </div>
  );
}
