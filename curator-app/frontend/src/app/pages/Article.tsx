import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Bookmark, Share2, Type } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ReadingProgressBar } from '../components/ReadingProgressBar';
import { TypographySettings } from '../components/TypographySettings';
import { ArticleReactions } from '../components/ArticleReactions';
import { ArticleAudioPlayer } from '../components/ArticleAudioPlayer';
import { ArticleCardSkeleton } from '../components/SkeletonLoaders';
import { useNavigate, useParams } from 'react-router';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useReadingPreferences } from '../context/ReadingPreferencesContext';
import { useReadingStats } from '../context/ReadingStatsContext';
import { useArticle, useArticles } from '../../hooks/use-articles';
import { useLayout } from '../../providers/layout-provider';
import { DEV_BANNER_HEIGHT } from '../../lib/layout';

export function Article({ articleId }: { articleId?: string } = {}) {
  const params = useParams();
  const id = articleId ?? params.id ?? params.slugOrId;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isArticleSaved, saveArticle, unsaveArticle } = useSavedArticles();
  const { success } = useToast();
  const { preferences, saveProgress } = useReadingPreferences();
  const { startSession, endSession } = useReadingStats();
  const { isWebDesktop, devBannerActive, mastheadHeight, readMeasure } = useLayout();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showTypographySettings, setShowTypographySettings] = useState(false);
  
  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const { data: article, isLoading } = useArticle(id ?? '');
  const { data: allArticles = [] } = useArticles();

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    const sameCategory = allArticles.filter(
      (candidate) => candidate.id !== article.id && candidate.category === article.category,
    );
    if (sameCategory.length >= 3) return sameCategory.slice(0, 3);
    const others = allArticles.filter(
      (candidate) => candidate.id !== article.id && candidate.category !== article.category,
    );
    return [...sameCategory, ...others].slice(0, 3);
  }, [article, allArticles]);

  const heroImageProps = article?.imageUrl
    ? { src: article.imageUrl, alt: article.title }
    : article
      ? { alt: article.title, query: article.imageQuery }
      : { alt: 'Article', query: '' };
  
  // Start reading session when article loads
  useEffect(() => {
    if (article?.id) {
      startSession(article.id);
      
      // End session on unmount
      return () => {
        endSession(article.id);
      };
    }
  }, [article?.id, startSession, endSession]);
  
  // Track scroll progress (throttled to 200ms)
  useEffect(() => {
    if (!article?.id) return;

    let lastSaved = 0;
    const THROTTLE_MS = 200;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastSaved < THROTTLE_MS) return;
      lastSaved = now;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;

      // Save progress every 5% change
      if (Math.floor(progress) % 5 === 0) {
        saveProgress(article.id, scrollTop, progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article?.id, saveProgress]);
  
  const handleSaveToggle = () => {
    if (!article) return;

    if (isArticleSaved(article.id)) {
      unsaveArticle(article.id);
      success('Article removed from saved');
    } else {
      const saved = saveArticle(article);
      if (saved) {
        success('Article saved!');
      }
    }
  };
  
  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };
  
  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    success('Link copied to clipboard!');
    setShowShareMenu(false);
  };
  
  const shareViaEmail = () => {
    if (!article) return;
    const subject = encodeURIComponent(article.title);
    const body = encodeURIComponent(`Check out this article on The Curator: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };
  
  if (isLoading) {
    return (
      <AppShell title="Article" archetype="read" showHeader={false}>
        <div className="py-12">
          <ArticleCardSkeleton />
        </div>
      </AppShell>
    );
  }

  if (!article) {
    return (
      <AppShell title="Article" archetype="read" showHeader={false}>
        <div className="py-24 text-center">
          <h1 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-4">
            Article not found
          </h1>
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="rounded-full bg-inverse-surface px-8 py-3 text-white hover:bg-primary"
          >
            Back to Explore
          </button>
        </div>
      </AppShell>
    );
  }
  
  const content = article.content || `This is a synthesized narrative from ${article.sources.length} trusted sources, providing a comprehensive view on ${article.category.toLowerCase()} developments.

${article.excerpt}

Our editorial team has analyzed perspectives from leading publications and research institutions to bring you this distilled insight. The convergence of these viewpoints reveals patterns and implications that individual articles might miss.

This approach to journalism—aggregating and synthesizing multiple authoritative sources—represents a new paradigm in news consumption. Rather than presenting a single perspective, we offer a curated synthesis that respects the complexity of important issues while making them accessible.

The implications of these developments extend across multiple sectors and geographies. Understanding these connections is essential for making informed decisions in an increasingly interconnected world.

As this story continues to develop, we'll update this narrative with new insights from our network of sources, ensuring you have access to the most current and comprehensive understanding available.`;

  const toolbarTop = isWebDesktop
    ? mastheadHeight + (devBannerActive ? DEV_BANNER_HEIGHT : 0) + 12
    : devBannerActive
      ? DEV_BANNER_HEIGHT + 16
      : 16;
  const articleMeasure =
    preferences.readingWidth === 'narrow'
      ? 650
      : preferences.readingWidth === 'wide'
        ? 900
        : readMeasure;
  
  return (
    <AppShell title={article.title} archetype="read" showHeader={false}>
      <div className="relative pb-12">
      {/* Article toolbar */}
      <div
        className="sticky z-40 -mx-4 mb-8 flex items-center justify-between gap-3 bg-background/90 px-4 py-3 backdrop-blur-xl lg:mx-0 lg:rounded-full lg:border lg:border-outline-variant/15 lg:bg-surface-container-lowest/80 lg:px-3"
        style={{ top: toolbarTop }}
      >
          {/* Left: Back Button (Circle Pill) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          {/* Right: Typography, Save & Share (Separate Pills) */}
          <div className="flex items-center gap-3">
            <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
              <button 
                onClick={() => setShowTypographySettings(true)}
                className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
              >
                <Type className="w-5 h-5 text-on-surface" />
              </button>
            </div>
            
            <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
              <button 
                onClick={handleSaveToggle}
                className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
              >
                {isArticleSaved(article.id) ? (
                  <Bookmark className="w-5 h-5 text-primary" fill="currentColor" />
                ) : (
                  <Bookmark className="w-5 h-5 text-on-surface" />
                )}
              </button>
            </div>
            
            <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
              <button 
                onClick={handleShare}
                className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors relative"
              >
                <Share2 className="w-5 h-5 text-on-surface" />
              </button>
            </div>
          </div>
        </div>
      
      {/* Reading Progress Bar */}
      <ReadingProgressBar />
      
      <div className="px-0">
        {/* Category Badge - Floating */}
        <div className="mb-6">
          <span 
            className="inline-block px-6 py-2 bg-primary-container/40 backdrop-blur-xl border border-outline-variant/15 text-on-primary-container text-[10px] uppercase tracking-[0.25em] font-bold shadow-lg"
            style={{ borderRadius: '25px 15px 30px 20px' }}
          >
            {article.category}
          </span>
        </div>
        
        {/* Title - Large and Editorial */}
        <h1 className="mb-8 max-w-[920px] font-[family-name:var(--font-headline)] text-5xl leading-[1.05] tracking-tight text-on-surface md:text-7xl">
          {article.title}
        </h1>
        
        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-3 text-outline mb-10 pb-10 border-b border-outline-variant/20">
          <span className="text-sm">{article.author || 'The Curator Editorial Team'}</span>
          <span className="text-sm">•</span>
          <span className="text-sm">{article.publishedDate || 'March 23, 2026'}</span>
          <span className="text-sm">•</span>
          <span className="text-sm">{article.readTime}</span>
        </div>

        <ArticleAudioPlayer
          articleId={article.id}
          audioUrl={article.audioUrl}
          durationSec={article.audioDurationSec}
          title={article.title}
        />
        
        {/* Hero Image - Full Width Organic Shape */}
        <div
          className="relative mb-12 overflow-hidden border border-outline-variant/15 shadow-2xl"
          style={{
            borderRadius: isWebDesktop ? '48px' : '0px',
            height: isWebDesktop ? 'clamp(320px, 45vw, 560px)' : '60vh',
          }}
        >
          <ImageWithFallback 
            className="w-full h-full object-cover" 
            {...heroImageProps}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/40 via-transparent to-transparent" />
        </div>
        
        {/* Sources - Inline Editorial Style */}
        <div className="mx-auto mb-12" style={{ maxWidth: articleMeasure }}>
          <p className="text-outline italic mb-4">
            This narrative synthesizes reporting from <span className="text-on-surface font-medium">{article.sources.length} trusted sources</span>, including:
          </p>
          <div className="flex flex-wrap gap-2">
            {article.sources.map((source, i) => (
              <span 
                key={i}
                className="text-on-surface text-sm"
              >
                {source}{i < article.sources.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        </div>
        
        {/* Article Content - Magazine Style */}
        <article 
          className="mb-16"
          style={{
            maxWidth: articleMeasure,
            margin: '0 auto'
          }}
        >
          <div className="prose prose-lg max-w-none">
            {content.split('\n\n').map((paragraph, i) => (
              <p 
                key={i} 
                className={`text-on-surface leading-[1.9] mb-8 ${
                  preferences.fontSize === 'small' ? 'text-base md:text-lg' :
                  preferences.fontSize === 'large' ? 'text-xl md:text-2xl' :
                  'text-lg md:text-xl'
                } ${
                  i === 0 
                    ? 'first-letter:text-7xl first-letter:font-[family-name:var(--font-headline)] first-letter:float-left first-letter:mr-4 first-letter:leading-[0.8] first-letter:text-primary' 
                    : ''
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </article>
        
        {/* Article Reactions */}
        <div className="flex justify-center mb-16">
          <ArticleReactions articleId={article.id} />
        </div>
        
        {/* Divider */}
        <div className="flex items-center justify-center mb-16">
          <div 
            className="h-1 bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent"
            style={{ width: '60%' }}
          />
        </div>
        
        {/* Related Narratives - Enhanced Cards */}
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-headline)] text-4xl md:text-5xl italic text-on-surface mb-3">
            Related Narratives
          </h2>
          <p className="text-outline mb-10">
            Continue exploring stories in {article.category}
          </p>
          
          <div className="space-y-8">
            {relatedArticles.map((relatedArticle, index) => (
                <div 
                  key={relatedArticle.id}
                  onClick={() => {
                    window.scrollTo(0, 0);
                    navigate(`/article/${relatedArticle.id}`);
                  }}
                  className="group cursor-pointer"
                >
                  {/* Alternating Layout */}
                  {index % 2 === 0 ? (
                    // Image Left, Content Right
                    <div className="flex flex-col md:flex-row gap-6 items-start hover:opacity-90 transition-opacity">
                      <div 
                        className="relative overflow-hidden border border-outline-variant/15 shadow-lg w-full md:w-1/2 shrink-0"
                        style={{ 
                          borderRadius: `${60 + index * 5}px ${30 + index * 3}px ${70 + index * 5}px ${40 + index * 3}px`,
                          height: '280px'
                        }}
                      >
                        <ImageWithFallback 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          {...(relatedArticle.imageUrl
                            ? { src: relatedArticle.imageUrl, alt: relatedArticle.title }
                            : { alt: relatedArticle.title, query: relatedArticle.imageQuery })}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-inverse-surface/60 via-transparent to-transparent" />
                        
                        {/* Floating Badge */}
                        <div 
                          className="absolute top-5 left-5 px-4 py-1.5 bg-white/95 backdrop-blur-sm text-inverse-surface text-[9px] uppercase tracking-[0.2em] font-bold shadow-lg"
                          style={{ borderRadius: '20px 12px 25px 15px' }}
                        >
                          {relatedArticle.category}
                        </div>
                      </div>
                      
                      <div className="flex-1 pt-2">
                        <h3 className="font-[family-name:var(--font-headline)] text-3xl md:text-4xl text-on-surface leading-tight mb-4 group-hover:text-primary transition-colors">
                          {relatedArticle.title}
                        </h3>
                        <p className="text-outline leading-relaxed mb-4 line-clamp-3">
                          {relatedArticle.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-outline text-sm">
                          <span>{relatedArticle.readTime}</span>
                          <span>•</span>
                          <span>{relatedArticle.sources.length} sources</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Content Left, Image Right
                    <div className="flex flex-col md:flex-row-reverse gap-6 items-start hover:opacity-90 transition-opacity">
                      <div 
                        className="relative overflow-hidden border border-outline-variant/15 shadow-lg w-full md:w-1/2 shrink-0"
                        style={{ 
                          borderRadius: `${70 + index * 5}px ${40 + index * 3}px ${60 + index * 5}px ${30 + index * 3}px`,
                          height: '280px'
                        }}
                      >
                        <ImageWithFallback 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          {...(relatedArticle.imageUrl
                            ? { src: relatedArticle.imageUrl, alt: relatedArticle.title }
                            : { alt: relatedArticle.title, query: relatedArticle.imageQuery })}
                        />
                        <div className="absolute inset-0 bg-gradient-to-bl from-inverse-surface/60 via-transparent to-transparent" />
                        
                        {/* Floating Badge */}
                        <div 
                          className="absolute top-5 right-5 px-4 py-1.5 bg-white/95 backdrop-blur-sm text-inverse-surface text-[9px] uppercase tracking-[0.2em] font-bold shadow-lg"
                          style={{ borderRadius: '20px 12px 25px 15px' }}
                        >
                          {relatedArticle.category}
                        </div>
                      </div>
                      
                      <div className="flex-1 pt-2">
                        <h3 className="font-[family-name:var(--font-headline)] text-3xl md:text-4xl text-on-surface leading-tight mb-4 group-hover:text-primary transition-colors">
                          {relatedArticle.title}
                        </h3>
                        <p className="text-outline leading-relaxed mb-4 line-clamp-3">
                          {relatedArticle.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-outline text-sm">
                          <span>{relatedArticle.readTime}</span>
                          <span>•</span>
                          <span>{relatedArticle.sources.length} sources</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      </div>
      
      {/* Share Menu Modal */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6"
          onClick={() => setShowShareMenu(false)}
        >
          <div 
            className="bg-surface-container-lowest p-8 max-w-sm w-full shadow-2xl"
            style={{ borderRadius: '60px 35px 70px 45px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-6 text-center">
              Share Article
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={copyLink}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-full transition-all text-center"
              >
                Copy Link
              </button>
              
              <button
                onClick={shareViaEmail}
                className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-3 px-6 rounded-full transition-all text-center"
              >
                Share via Email
              </button>
              
              <button
                onClick={() => setShowShareMenu(false)}
                className="w-full bg-transparent border-2 border-outline-variant hover:bg-surface-container text-on-surface py-3 px-6 rounded-full transition-all text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Typography Settings Modal */}
      <TypographySettings 
        isOpen={showTypographySettings}
        onClose={() => setShowTypographySettings(false)}
      />
      </div>
    </AppShell>
  );
}