import { useEffect, useMemo, useState } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp, Clock, Compass } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

import { AppShell } from '../components/AppShell';
import { ArticleCard } from '../components/ArticleCard';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useAuth } from '../context/AuthContext';
import { useReadingStats } from '../context/ReadingStatsContext';
import { useArticles } from '../../hooks/use-articles';
import { useCategories } from '../../hooks/use-categories';
import { FeedStack } from '../../ui/feed-stack';
import { useLayout } from '../../providers/layout-provider';
import type { Article } from '../../data/articles';

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function formatCategoryLabel(value: string): string {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { isArticleSaved } = useSavedArticles();
  const { recentArticleIds } = useReadingStats();
  const { isWebDesktop } = useLayout();
  const { data: articles = [], isLoading } = useArticles();
  const { data: apiCategories = [] } = useCategories();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [readingStatus, setReadingStatus] = useState<'all' | 'saved' | 'unsaved'>('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const hasActiveFilters = selectedCategories.length > 0 || readingStatus !== 'all';
  const isBrowsing = !searchQuery.trim() && !hasActiveFilters;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const categoryOptions = useMemo(() => {
    if (apiCategories.length > 0) {
      return apiCategories.map((category) => ({
        key: normalizeCategory(category.slug),
        label: category.name,
      }));
    }
    return Array.from(new Set(articles.map((a) => normalizeCategory(a.category)).filter(Boolean))).map(
      (category) => ({ key: category, label: formatCategoryLabel(category) }),
    );
  }, [apiCategories, articles]);

  const recentArticles = useMemo(
    () =>
      recentArticleIds
        .map((rid) => articles.find((a) => a.id === rid))
        .filter((a): a is Article => Boolean(a)),
    [recentArticleIds, articles],
  );

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          article.title.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.category.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (selectedCategories.length > 0 && !selectedCategories.includes(normalizeCategory(article.category))) {
        return false;
      }

      const saved = isArticleSaved(article.id);
      if (readingStatus === 'saved' && !saved) return false;
      if (readingStatus === 'unsaved' && saved) return false;

      return true;
    });
  }, [articles, searchQuery, selectedCategories, readingStatus, isArticleSaved]);

  const browseArticles = useMemo(() => articles.slice(0, isWebDesktop ? 9 : 6), [articles, isWebDesktop]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell title="Search" archetype="feed">
      <div className="space-y-8">
        <div>
          {!isWebDesktop && (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-outline">
              Find a narrative
            </p>
          )}
          <div className="relative">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search narratives, topics, categories…"
              className="search-hero-input w-full py-4 pl-14 pr-14 text-base text-on-surface"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-2 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/15 bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {filtersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <span className="text-sm text-on-surface-variant">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {filtersExpanded && (
          <div className="editorial-card space-y-5 p-5 md:p-6">
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-outline">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => toggleCategory(cat.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                      selectedCategories.includes(cat.key)
                        ? 'border-outline-variant/20 bg-secondary-container text-on-secondary-container'
                        : 'border-outline-variant/20 text-outline hover:bg-surface-container-low'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-outline">Reading status</p>
              <div className="flex flex-wrap gap-2">
                {(['all', 'saved', 'unsaved'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReadingStatus(status)}
                    className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
                      readingStatus === status
                        ? 'border-outline-variant/20 bg-secondary-container text-on-secondary-container'
                        : 'border-outline-variant/20 text-outline hover:bg-surface-container-low'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-center text-on-surface-variant">Loading narratives…</p>
        ) : isBrowsing ? (
          <>
            {recentArticles.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-outline">
                  <Clock className="h-4 w-4" />
                  Recently read
                </div>
                <FeedStack variant="compact">
                  {recentArticles.slice(0, 5).map((article) => (
                    <ArticleCard key={article.id} article={article} variant="compact" />
                  ))}
                </FeedStack>
              </section>
            )}

            {browseArticles.length > 0 ? (
              <section className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-outline">Browse</p>
                    <h2 className="mt-1 font-[family-name:var(--font-headline)] text-2xl italic text-on-surface">
                      All narratives
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/explore')}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Compass className="h-4 w-4" />
                    Explore
                  </button>
                </div>
                {isWebDesktop ? (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {browseArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} variant="grid" />
                    ))}
                  </div>
                ) : (
                  <FeedStack variant="compact">
                    {browseArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} variant="compact" />
                    ))}
                  </FeedStack>
                )}
              </section>
            ) : (
              <div className="editorial-card py-16 text-center">
                <Search className="mx-auto h-12 w-12 text-outline-variant" />
                <h3 className="mt-4 font-[family-name:var(--font-headline)] text-xl text-on-surface">No narratives yet</h3>
                <p className="mt-2 text-on-surface-variant">Check back soon or explore when stories are available.</p>
                <button
                  type="button"
                  onClick={() => navigate('/explore')}
                  className="mt-6 rounded-full bg-inverse-surface px-6 py-2.5 text-sm text-inverse-on-surface hover:bg-primary"
                >
                  Go to Explore
                </button>
              </div>
            )}
          </>
        ) : filteredArticles.length > 0 ? (
          isWebDesktop && filteredArticles.length >= 4 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="grid" />
              ))}
            </div>
          ) : (
            <FeedStack variant="compact">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="compact" />
              ))}
            </FeedStack>
          )
        ) : (
          <div className="editorial-card py-16 text-center">
            <Search className="mx-auto h-12 w-12 text-outline-variant" />
            <h3 className="mt-4 font-[family-name:var(--font-headline)] text-xl text-on-surface">No matches</h3>
            <p className="mt-2 text-on-surface-variant">Try different keywords or clear your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategories([]);
                setReadingStatus('all');
              }}
              className="mt-6 text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
