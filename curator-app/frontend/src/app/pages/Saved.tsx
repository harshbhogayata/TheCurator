import { useEffect, useMemo, useState } from 'react';
import { Trash2, Bookmark, FolderPlus, Lock } from 'lucide-react';
import { useNavigate } from 'react-router';

import { AppShell } from '../components/AppShell';
import { ArticleCard } from '../components/ArticleCard';
import { PaywallModal } from '../components/PaywallModal';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useToast } from '../components/Toast';
import { useSavedArticlesList } from '../../hooks/use-articles';
import { ArticleCardSkeleton } from '../components/SkeletonLoaders';
import { isMockBackend } from '../../lib/dev-mode';
import { FeedStack } from '../../ui/feed-stack';

export function Saved() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { unsaveArticle, savedCount, savedArticles: contextSaved } = useSavedArticles();
  const { hasUnlimitedSaves, maxSaves } = useSubscription();
  const { success } = useToast();
  const { data: apiSaved = [], isLoading: isApiLoading } = useSavedArticlesList();
  const savedArticles = isMockBackend ? contextSaved : apiSaved;
  const isLoading = isMockBackend ? false : isApiLoading;

  const [showCollectionPaywall, setShowCollectionPaywall] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [filterText, setFilterText] = useState('');

  const percentUsed = maxSaves === Infinity ? 0 : Math.round((savedCount / maxSaves) * 100);
  const remainingSaves = maxSaves === Infinity ? Infinity : maxSaves - savedCount;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const filteredArticles = useMemo(
    () => savedArticles.filter((article) => article.title.toLowerCase().includes(filterText.toLowerCase())),
    [savedArticles, filterText],
  );

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
    selectedArticles.forEach((id) => unsaveArticle(id));
    setSelectedArticles(new Set());
    success('Articles removed from saved');
  };

  return (
    <AppShell title="Saved" archetype="feed">
      <div className="space-y-8">
        {!hasUnlimitedSaves && (
          <div
            className={`rounded-[40px] border p-6 backdrop-blur-xl ${
              percentUsed >= 90
                ? 'border-error bg-error-container/50'
                : 'border-outline-variant/15 bg-surface-container-lowest/70'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-on-surface">
                  {savedCount} of {maxSaves} articles saved
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {remainingSaves === Infinity ? 'Unlimited' : `${remainingSaves} slots remaining`}
                </p>
              </div>
              {percentUsed >= 70 && (
                <button
                  type="button"
                  onClick={() => navigate('/donate')}
                  className="rounded-full bg-inverse-surface px-4 py-2 text-sm text-white hover:bg-primary"
                >
                  Upgrade
                </button>
              )}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container">
              <div
                className={`h-full ${percentUsed >= 90 ? 'bg-error' : 'bg-primary'}`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-start gap-4 rounded-[40px] border border-outline-variant/15 bg-surface-container-lowest/70 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container">
            {hasUnlimitedSaves ? (
              <FolderPlus className="h-6 w-6 text-on-secondary-container" />
            ) : (
              <Lock className="h-6 w-6 text-on-secondary-container" />
            )}
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-headline)] text-xl text-on-surface">
              {hasUnlimitedSaves ? 'Organize with Collections' : 'Unlock Collections'}
            </h3>
            <p className="mt-2 text-on-surface-variant">
              {hasUnlimitedSaves
                ? 'Create custom collections to organize saved articles.'
                : 'Upgrade to Premium to create unlimited collections.'}
            </p>
            <button
              type="button"
              onClick={() => (hasUnlimitedSaves ? navigate('/collections') : setShowCollectionPaywall(true))}
              className="mt-3 text-sm text-primary hover:underline"
            >
              {hasUnlimitedSaves ? 'Manage Collections →' : 'Learn More'}
            </button>
          </div>
        </div>

        {selectedArticles.size > 0 && (
          <div className="flex items-center justify-between rounded-[30px] bg-inverse-surface p-4 text-white">
            <span>{selectedArticles.size} selected</span>
            <div className="flex gap-3">
              <button type="button" onClick={() => setSelectedArticles(new Set())} className="rounded-full bg-white/20 px-4 py-2">
                Cancel
              </button>
              <button type="button" onClick={handleBulkDelete} className="flex items-center gap-2 rounded-full bg-error px-4 py-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="Filter articles..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full rounded-full border border-outline-variant/15 bg-surface-container-lowest/70 px-4 py-2 text-on-surface"
        />

        {isLoading ? (
          <FeedStack>
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </FeedStack>
        ) : filteredArticles.length === 0 ? (
          <div className="rounded-[60px] border border-outline-variant/15 bg-surface-container-lowest/70 p-16 text-center">
            <Bookmark className="mx-auto mb-4 h-16 w-16 text-outline" />
            <h2 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface">No saved articles yet</h2>
            <p className="mx-auto mt-3 max-w-md text-on-surface-variant">
              Start saving articles you want to read later.
            </p>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="mt-6 rounded-full bg-inverse-surface px-8 py-3 text-white hover:bg-primary"
            >
              Explore Articles
            </button>
          </div>
        ) : (
          <FeedStack>
            {filteredArticles.map((article) => (
              <div key={article.id} className="relative">
                <div className="absolute left-4 top-4 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Set(selectedArticles);
                      if (next.has(article.id)) next.delete(article.id);
                      else next.add(article.id);
                      setSelectedArticles(next);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      selectedArticles.has(article.id) ? 'border-primary bg-primary' : 'border-outline-variant bg-surface-container'
                    }`}
                  />
                </div>
                <div className="absolute right-4 top-4 z-10">
                  <button
                    type="button"
                    onClick={() => handleDelete(article.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-error text-error-foreground shadow-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <ArticleCard article={article} variant="compact" />
              </div>
            ))}
          </FeedStack>
        )}
      </div>

      <PaywallModal
        isOpen={showCollectionPaywall}
        onClose={() => setShowCollectionPaywall(false)}
        feature="Collections"
        description="Create unlimited custom collections to organize your saved articles."
        requiredTier="premium"
      />
    </AppShell>
  );
}
