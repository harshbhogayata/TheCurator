import { useState, useMemo } from 'react';
import { Search, Filter, X, Calendar, Tag as TagIcon } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ArticleCard } from '../components/ArticleCard';
import { articles } from '../data/articles';
import { useNavigate } from 'react-router';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useReadingPreferences } from '../context/ReadingPreferencesContext';

export function SearchPage() {
  const navigate = useNavigate();
  const { savedArticles } = useSavedArticles();
  const { getArticleTags, getAllTags } = useReadingPreferences();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [readingStatus, setReadingStatus] = useState<'all' | 'saved' | 'unsaved'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Get all unique categories and sources
  const allCategories = Array.from(new Set(articles.map(a => a.category)));
  const allSources = Array.from(new Set(articles.flatMap(a => a.sources)));
  const allTags = getAllTags();
  
  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesExcerpt = article.excerpt.toLowerCase().includes(query);
        const matchesCategory = article.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesExcerpt && !matchesCategory) return false;
      }
      
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(article.category)) {
        return false;
      }
      
      // Source filter
      if (selectedSources.length > 0) {
        const hasSource = article.sources.some(s => selectedSources.includes(s));
        if (!hasSource) return false;
      }
      
      // Tags filter
      if (selectedTags.length > 0) {
        const articleTags = getArticleTags(article.id);
        const hasTag = selectedTags.some(t => articleTags.includes(t));
        if (!hasTag) return false;
      }
      
      // Reading status filter
      if (readingStatus === 'saved') {
        if (!savedArticles.some(s => s.id === article.id)) return false;
      } else if (readingStatus === 'unsaved') {
        if (savedArticles.some(s => s.id === article.id)) return false;
      }
      
      return true;
    });
  }, [searchQuery, selectedCategories, selectedSources, selectedTags, readingStatus, articles, savedArticles, getArticleTags]);
  
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedSources([]);
    setSelectedTags([]);
    setReadingStatus('all');
    setDateRange('all');
  };
  
  const activeFiltersCount = 
    selectedCategories.length + 
    selectedSources.length + 
    selectedTags.length + 
    (readingStatus !== 'all' ? 1 : 0) +
    (dateRange !== 'all' ? 1 : 0);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header */}
      <header className="pt-8 px-6 mb-6">
        <h1 className="font-[family-name:var(--font-headline)] text-5xl text-on-surface mb-6">
          Search
        </h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles, categories, topics..."
            className="w-full pl-12 pr-12 py-4 bg-surface-container-lowest border border-outline-variant/20 rounded-3xl text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-outline" />
            </button>
          )}
        </div>
        
        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-full hover:bg-surface-container transition-colors"
          >
            <Filter className="w-4 h-4 text-on-surface" />
            <span className="text-on-surface text-sm">
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </span>
          </button>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-primary text-sm hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </header>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="px-6 mb-6 animate-slide-up">
          <div 
            className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 p-6 space-y-6"
            style={{ borderRadius: '40px 30px 50px 35px' }}
          >
            {/* Categories */}
            <div>
              <h3 className="text-on-surface font-medium mb-3 flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedCategories.includes(category)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sources */}
            <div>
              <h3 className="text-on-surface font-medium mb-3">Sources</h3>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {allSources.slice(0, 15).map(source => (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      selectedSources.includes(source)
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tags */}
            {allTags.length > 0 && (
              <div>
                <h3 className="text-on-surface font-medium mb-3">Custom Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-tertiary text-tertiary-foreground'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Reading Status */}
            <div>
              <h3 className="text-on-surface font-medium mb-3">Reading Status</h3>
              <div className="flex gap-2">
                {(['all', 'saved', 'unsaved'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setReadingStatus(status)}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm capitalize transition-all ${
                      readingStatus === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Results */}
      <div className="px-6">
        <p className="text-outline text-sm mb-6">
          {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
        </p>
        
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => navigate(`/article/${article.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-surface-container mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-outline" />
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-2">
              No articles found
            </h3>
            <p className="text-outline mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-primary/90 transition-all"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
