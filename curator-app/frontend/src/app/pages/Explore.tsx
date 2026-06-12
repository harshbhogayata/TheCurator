import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router';

import { AppShell } from '../components/AppShell';
import { ArticleCard } from '../components/ArticleCard';
import { AdBanner } from '../components/AdBanner';
import { ArticleCardSkeleton } from '../components/SkeletonLoaders';
import { FeedStack } from '../../ui/feed-stack';
import { EditorialGrid } from '../../ui/editorial-grid';
import { useLayout } from '../../providers/layout-provider';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useArticles, useForYouArticles } from '../../hooks/use-articles';
import { useCategories } from '../../hooks/use-categories';

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function formatCategoryLabel(value: string): string {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Explore() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { hasAdFree } = useSubscription();
  const { isWebDesktop } = useLayout();
  const { data: articles = [], isLoading: isArticlesLoading, refetch } = useArticles();
  const { data: apiCategories, isLoading: isCategoriesLoading } = useCategories();

  const [viewMode, setViewMode] = useState<'foryou' | 'today' | 'global'>('today');
  const { data: forYouArticles = [], isLoading: isForYouLoading } = useForYouArticles(
    viewMode === 'foryou',
  );
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const isLoading =
    isArticlesLoading || isCategoriesLoading || (viewMode === 'foryou' && isForYouLoading);

  const categoryOptions = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) {
      return [
        { key: 'all', label: 'All' },
        ...apiCategories.map((category) => ({
          key: normalizeCategory(category.slug),
          label: category.name,
        })),
      ];
    }

    const articleCategories = Array.from(
      new Set(articles.map((article) => normalizeCategory(article.category)).filter(Boolean)),
    );
    return [
      { key: 'all', label: 'All' },
      ...articleCategories.map((category) => ({
        key: category,
        label: formatCategoryLabel(category),
      })),
    ];
  }, [apiCategories, articles]);

  const sourceArticles = viewMode === 'foryou' ? forYouArticles : articles;
  const topNarratives =
    viewMode === 'global' ? articles.slice(6, 8) : sourceArticles.slice(0, 2);

  const filteredExploreArticles = useMemo(() => {
    let list = sourceArticles.slice(2);
    if (selectedCategory !== 'all') {
      list = list.filter((a) => normalizeCategory(a.category) === selectedCategory);
    }
    return list;
  }, [sourceArticles, selectedCategory]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell title="Explore" archetype="feed">
      <div className="space-y-8 lg:space-y-10">
        {!hasAdFree && <AdBanner position="top" />}

        {isLoading ? (
          <div className="space-y-8">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-outline lg:block">
                  Curated from trusted sources
                </p>
                <h2 className="font-[family-name:var(--font-headline)] text-xl italic text-on-surface sm:text-2xl lg:text-4xl">
                Top Narratives
                </h2>
              </div>
              <div className="flex gap-2">
                {(['foryou', 'today', 'global'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setViewMode(mode);
                      setSelectedCategory('all');
                    }}
                    className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-widest transition-all ${
                      viewMode === mode
                        ? 'border-outline-variant/20 bg-secondary-container text-on-secondary-container'
                        : 'border-transparent text-outline hover:bg-surface-container-low'
                    }`}
                  >
                    {mode === 'foryou' ? 'For You' : mode === 'today' ? 'Today' : 'Global'}
                  </button>
                ))}
              </div>
            </div>

            {!isWebDesktop && (
              <FeedStack>
                {topNarratives.map((article, index) => (
                  <div key={article.id}>
                    <ArticleCard article={article} variant={index === 0 ? 'featured' : 'default'} />
                    {index === 0 && !hasAdFree && (
                      <div className="mt-8">
                        <AdBanner position="inline" />
                      </div>
                    )}
                  </div>
                ))}
              </FeedStack>
            )}

            {isWebDesktop && !hasAdFree && <AdBanner position="inline" />}

            <div className="overflow-x-auto pb-2 lg:overflow-visible">
              <div className="flex min-w-max gap-2 lg:min-w-0 lg:flex-wrap">
                {categoryOptions.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-widest transition-all ${
                        isSelected
                          ? 'border-outline-variant/20 bg-secondary-container text-on-secondary-container'
                          : 'border-outline-variant/20 text-outline hover:bg-surface-container-low'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-on-surface-variant">{filteredExploreArticles.length} narratives</p>
              {isWebDesktop && (
                <p className="text-xs uppercase tracking-[0.22em] text-outline">
                  {viewMode === 'today' ? 'Today' : 'Global'} edition
                </p>
              )}
            </div>

            {isWebDesktop ? (
              <EditorialGrid topArticles={topNarratives} stories={filteredExploreArticles} />
            ) : filteredExploreArticles.length === 0 ? (
              <div className="py-16 text-center">
                <SearchIcon className="mx-auto h-12 w-12 text-outline-variant" />
                <h3 className="mt-4 text-xl text-on-surface">No narratives found</h3>
                <p className="mt-2 text-on-surface-variant">Try adjusting your filters.</p>
              </div>
            ) : (
              <FeedStack>
                {filteredExploreArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </FeedStack>
            )}
          </>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="text-sm text-outline hover:text-primary disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh feed'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
