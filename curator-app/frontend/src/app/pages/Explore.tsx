import { useState, useEffect } from 'react';
import { Menu, Search, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ArticleCard } from '../components/ArticleCard';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { AdBanner } from '../components/AdBanner';
import { AdCard } from '../components/AdCard';
import { articles } from '../data/articles';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { IMAGES } from '../constants/images';

const categories = [
  'All',
  'Politics',
  'Technology',
  'Science',
  'Business',
  'Culture',
  'Environment',
  'Health',
  'World'
];

export function Explore() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { hasAdFree } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }
  
  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const trendingTopics = [
    'Climate Policy',
    'AI Governance',
    'Space Mining',
    'Digital Democracy',
    'Longevity Research'
  ];
  
  // Create grid with ad cards interspersed for free users
  const createArticleGrid = () => {
    if (hasAdFree) {
      return filteredArticles.map((article) => (
        <ArticleCard key={article.id} article={article} variant="featured" />
      ));
    }
    
    // For free users, insert ad card every 3 articles
    const gridItems: JSX.Element[] = [];
    filteredArticles.forEach((article, index) => {
      gridItems.push(
        <ArticleCard key={article.id} article={article} variant="featured" />
      );
      
      // Add ad card after every 3rd article (but not at the very end)
      if ((index + 1) % 3 === 0 && index < filteredArticles.length - 1) {
        gridItems.push(
          <AdCard key={`ad-${index}`} />
        );
      }
    });
    
    return gridItems;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header with Separate Pill Containers */}
      <header className="fixed top-0 w-full z-50 pt-4 sm:pt-6 px-4 sm:px-6">
        <div className="flex justify-between items-center gap-2 sm:gap-3 mb-4">
          {/* Left: Menu Button (Circle Pill) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate('/menu')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <Menu className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          {/* Center: Title (Long Pill) */}
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-4 sm:px-6 py-2 sm:py-2.5 min-w-0">
            <h1 className="text-xl sm:text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center truncate">
              Explore
            </h1>
          </div>
          
          {/* Right: Badge + Profile (Pill Container) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3">
            <SubscriptionBadge size="sm" />
            <div 
              className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/15 cursor-pointer shrink-0"
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
        
        {/* Search Bar (Separate Pill) */}
        <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] relative overflow-hidden">
          <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-outline pointer-events-none z-10" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search narratives, categories..."
            className="w-full py-3 px-12 sm:px-14 bg-transparent text-on-surface placeholder:text-outline focus:outline-none"
          />
        </div>
      </header>
      
      <main className="pt-36 sm:pt-40 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Ad Banner for free users */}
        {!hasAdFree && <AdBanner position="top" />}
        
        {/* Trending Topics */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4 px-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-[family-name:var(--font-headline)] text-xl italic text-on-surface">
              Trending Now
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSearchQuery(topic)}
                className="px-5 py-2 rounded-full bg-primary-container hover:bg-primary-fixed text-on-primary-container text-sm border border-outline-variant/15 transition-all"
              >
                {topic}
              </button>
            ))}
          </div>
        </section>
        
        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-sm uppercase tracking-widest whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-secondary-container text-on-secondary-container border border-outline-variant/15'
                    : 'bg-transparent text-outline hover:bg-surface-container-low'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mb-6 px-2">
          <p className="text-outline text-sm">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'narrative' : 'narratives'} found
          </p>
        </div>
        
        {/* Articles Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {createArticleGrid()}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface-container flex items-center justify-center">
              <Search className="w-10 h-10 text-outline" />
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-2">
              No narratives found
            </h3>
            <p className="text-on-surface-variant mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="bg-inverse-surface text-inverse-on-surface px-6 py-2 rounded-full hover:bg-primary transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
        
        {/* Bottom Ad Banner for free users */}
        {!hasAdFree && filteredArticles.length > 0 && <AdBanner position="bottom" />}
      </main>
      
      <BottomNav />
    </div>
  );
}