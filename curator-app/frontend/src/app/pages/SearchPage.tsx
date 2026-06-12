import { useEffect, useMemo, useState } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

import { AppShell } from '../components/AppShell';
import { ArticleCard } from '../components/ArticleCard';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../../hooks/use-articles';
import { useCategories } from '../../hooks/use-categories';
import { FeedStack } from '../../ui/feed-stack';

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
  const { data: articles = [] } = useArticles();
  const { data: apiCategories = [] } = useCategories();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [readingStatus, setReadingStatus] = useState<'all' | 'saved' | 'unsaved'>('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

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
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search narratives, topics, categories…"
            className="w-full rounded-full border border-outline-variant/20 bg-surface-container-lowest/80 py-4 pl-12 pr-12 text-on-surface shadow-sm backdrop-blur-xl focus:border-primary focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-surface-container"
            >
              <X className="h-4 w-4 text-outline" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {filtersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {filtersExpanded && (
          <div className="space-y-4 rounded-[30px] border border-outline-variant/15 bg-surface-container-lowest/70 p-5">
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-outline">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => toggleCategory(cat.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wider ${
                      selectedCategories.includes(cat.key)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-outline-variant/20 text-outline'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-outline">Reading status</p>
              <div className="flex gap-2">
                {(['all', 'saved', 'unsaved'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReadingStatus(status)}
                    className={`rounded-full border px-3 py-1.5 text-xs capitalize ${
                      readingStatus === status
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-outline-variant/20 text-outline'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-on-surface-variant">
          {filteredArticles.length} {filteredArticles.length === 1 ? 'result' : 'results'}
        </p>

        <FeedStack variant="compact">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="compact" />
          ))}
        </FeedStack>

        {filteredArticles.length === 0 && (
          <div className="py-16 text-center text-on-surface-variant">No articles match your search.</div>
        )}
      </div>
    </AppShell>
  );
}
