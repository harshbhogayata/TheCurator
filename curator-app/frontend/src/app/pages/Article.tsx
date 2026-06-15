import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '../components/AppShell';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ReadingProgressBar } from '../components/ReadingProgressBar';
import { TypographySettings } from '../components/TypographySettings';
import { ArticleAudioPlayer } from '../components/ArticleAudioPlayer';
import { ArticleCardSkeleton } from '../components/SkeletonLoaders';
import { AddToCollectionModal } from '../components/AddToCollectionModal';
import { ArticleCard } from '../components/ArticleCard';
import { useNavigate, useParams } from 'react-router';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useReadingPreferences } from '../context/ReadingPreferencesContext';
import { useReadingStats } from '../context/ReadingStatsContext';
import { useArticle, useArticles } from '../../hooks/use-articles';
import { useLayout } from '../../providers/layout-provider';
import { organicShapeStyle } from '../../lib/layout';
import { shape } from '../../ui/tokens/spacing';
import { ArticleReaderToolbar } from '../../ui/article-reader-toolbar';
import { FeedStack } from '../../ui/feed-stack';

export function Article({ articleId }: { articleId?: string } = {}) {
  const params = useParams();
  const id = articleId ?? params.id ?? params.slugOrId;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isArticleSaved, saveArticle, unsaveArticle } = useSavedArticles();
  const { success } = useToast();
  const { preferences, saveProgress } = useReadingPreferences();
  const { startSession, endSession } = useReadingStats();
  const { isWebDesktop, mastheadHeight, readMeasure } = useLayout();
  const [showTypographySettings, setShowTypographySettings] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const { data: article, isLoading, isError, refetch } = useArticle(id ?? '');
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

  useEffect(() => {
    if (article?.id) {
      startSession(article.id);
      return () => endSession(article.id);
    }
  }, [article?.id, startSession, endSession]);

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
      if (saved) success('Article saved!');
    }
  };

  const handleShare = async () => {
    if (!article) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.excerpt, url });
        return;
      } catch {
        // user cancelled
      }
    }
    await navigator.clipboard.writeText(url);
    success('Link copied to clipboard!');
  };

  const toolbarTop = isWebDesktop ? mastheadHeight + 12 : 16;

  const articleMeasure =
    preferences.readingWidth === 'narrow'
      ? 650
      : preferences.readingWidth === 'wide'
        ? 900
        : readMeasure;

  const bodyFontClass =
    preferences.fontSize === 'small'
      ? 'text-base md:text-lg'
      : preferences.fontSize === 'large'
        ? 'text-xl md:text-2xl'
        : 'text-lg md:text-xl';

  if (isLoading) {
    return (
      <AppShell title="Article" archetype="read" showHeader={false}>
        <div className="py-12">
          <ArticleCardSkeleton />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell title="Article" archetype="read" showHeader={false}>
        <div className="py-24 text-center">
          <h1 className="mb-4 font-[family-name:var(--font-headline)] text-3xl text-on-surface">
            We couldn&apos;t load this article
          </h1>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-full bg-inverse-surface px-8 py-3 text-inverse-on-surface hover:bg-primary"
          >
            Try again
          </button>
        </div>
      </AppShell>
    );
  }

  if (!article) {
    return (
      <AppShell title="Article" archetype="read" showHeader={false}>
        <div className="py-24 text-center">
          <h1 className="mb-4 font-[family-name:var(--font-headline)] text-3xl text-on-surface">
            Article not found
          </h1>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full bg-inverse-surface px-8 py-3 text-inverse-on-surface hover:bg-primary"
          >
            Go back
          </button>
        </div>
      </AppShell>
    );
  }

  const paragraphs = (article.content?.trim() ?? '')
    .split('\n\n')
    .filter((p) => p.trim().length > 0);

  return (
    <AppShell title={article.title} archetype="read" showHeader={false} showMasthead={isWebDesktop}>
      <ReadingProgressBar />

      <div className="relative pb-16 lg:pb-24">
        <ArticleReaderToolbar
          topOffset={toolbarTop}
          isSaved={isArticleSaved(article.id)}
          onBack={() => navigate(-1)}
          onTypography={() => setShowTypographySettings(true)}
          onSave={handleSaveToggle}
          onCollection={() => setShowCollectionModal(true)}
          onShare={() => void handleShare()}
        />

        <div className="mx-auto" style={{ maxWidth: isWebDesktop ? articleMeasure : undefined }}>
          <span className="mb-5 inline-block rounded-full bg-secondary-container px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-on-secondary-container">
            {article.category}
          </span>

          <h1 className="mb-6 font-[family-name:var(--font-headline)] text-4xl leading-[1.08] tracking-tight text-on-surface md:text-5xl lg:text-6xl">
            {article.title}
          </h1>

          <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-outline-variant/20 pb-8 text-sm text-outline">
            <span>{article.author || 'The Curator Editorial Team'}</span>
            <span>·</span>
            <span>{article.publishedDate}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
        </div>

        <div
          className="relative mb-10 overflow-hidden border border-outline-variant/15 shadow-2xl lg:mb-12"
          style={{
            ...organicShapeStyle(shape.imageHero),
            height: isWebDesktop ? 'clamp(320px, 40vw, 520px)' : '300px',
            maxWidth: isWebDesktop ? articleMeasure : undefined,
            margin: isWebDesktop ? '0 auto 2.5rem' : '0 0 2.5rem',
          }}
        >
          <ImageWithFallback className="h-full w-full object-cover" {...heroImageProps} />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>

        <div className="mx-auto mb-8" style={{ maxWidth: articleMeasure }}>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-outline">Sources</p>
          <div className="flex flex-wrap gap-2">
            {article.sources.map((source, index) => (
              <span
                key={`${source}-${index}`}
                className="rounded-full border border-outline-variant/20 bg-surface-container-low px-3 py-1.5 text-sm text-on-surface-variant"
              >
                {source}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mb-10" style={{ maxWidth: articleMeasure }}>
          <ArticleAudioPlayer
            articleId={article.id}
            audioUrl={article.audioUrl}
            durationSec={article.audioDurationSec}
            title={article.title}
          />
        </div>

        <article className="mx-auto mb-16" style={{ maxWidth: articleMeasure }}>
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={`mb-8 font-[family-name:var(--font-headline)] leading-[1.85] text-on-surface ${bodyFontClass} ${
                  index === 0
                    ? 'first-letter:float-left first-letter:mr-3 first-letter:font-[family-name:var(--font-headline)] first-letter:text-5xl first-letter:leading-[0.85] first-letter:text-primary md:first-letter:text-6xl'
                    : ''
                }`}
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-on-surface-variant">The full narrative is not available right now.</p>
          )}
        </article>

        {relatedArticles.length > 0 && (
          <section className="mx-auto border-t border-outline-variant/15 pt-12" style={{ maxWidth: isWebDesktop ? 960 : articleMeasure }}>
            <h2 className="mb-8 font-[family-name:var(--font-headline)] text-2xl italic text-on-surface lg:text-3xl">
              Similar Narratives
            </h2>
            <FeedStack variant="compact">
              {relatedArticles.map((relatedArticle) => (
                <ArticleCard key={relatedArticle.id} article={relatedArticle} variant="compact" />
              ))}
            </FeedStack>
          </section>
        )}
      </div>

      {showCollectionModal && (
        <AddToCollectionModal article={article} onClose={() => setShowCollectionModal(false)} />
      )}

      <TypographySettings
        isOpen={showTypographySettings}
        onClose={() => setShowTypographySettings(false)}
      />
    </AppShell>
  );
}
