import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bookmark, Headphones, Lock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Article } from '../../data/articles';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useToast } from './Toast';
import { organicShapeStyle } from '../../lib/layout';
import { shape } from '../../ui/tokens/spacing';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact' | 'featured' | 'grid';
  onClick?: () => void;
}

function hasAudioAvailable(article: Article): boolean {
  return Boolean(article.audioUrl || article.audioDurationSec);
}

export function ArticleCard({ article, variant = 'default', onClick }: ArticleCardProps) {
  const navigate = useNavigate();
  const { saveArticle, unsaveArticle, isArticleSaved, savedCount } = useSavedArticles();
  const { maxSaves, hasUnlimitedSaves } = useSubscription();
  const { success, error, warning } = useToast();
  const [pressed, setPressed] = useState(false);

  const isSaved = isArticleSaved(article.id);
  const canSave = hasUnlimitedSaves || savedCount < maxSaves;
  const hasAudio = hasAudioAvailable(article);
  const isFeatured = variant === 'featured';

  const handleArticleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    navigate(`/article/${article.id}`);
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isSaved) {
      unsaveArticle(article.id);
      success('Article removed from saved');
      return;
    }

    if (!canSave) {
      error(`Save limit reached (${maxSaves}/${maxSaves})`);
      warning('Upgrade your plan for more saves');
      setTimeout(() => navigate('/donate'), 2000);
      return;
    }

    const saved = saveArticle(article);
    if (saved) {
      success('Article saved!');
    }
  };

  const imageProps = article.imageUrl
    ? { src: article.imageUrl, alt: article.title }
    : { alt: article.title, query: article.imageQuery };

  const SaveButton = ({ className = 'right-3 top-3' }: { className?: string }) => (
    <button
      onClick={handleSaveToggle}
      className={`absolute z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all ${className} ${
        isSaved
          ? 'border border-primary/30 bg-surface-container-lowest/95 text-primary shadow-lg'
          : 'border border-outline-variant/30 bg-surface-container-lowest/80 text-on-surface-variant shadow-md hover:bg-surface-container-lowest/95 hover:text-primary'
      }`}
      aria-label={isSaved ? 'Remove from saved' : 'Save article'}
    >
      {isSaved ? (
        <Bookmark className="h-4 w-4" fill="currentColor" />
      ) : !canSave ? (
        <Lock className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </button>
  );

  const SourceBadges = ({ limit = 4 }: { limit?: number }) => (
    <div className="absolute bottom-4 left-4 flex items-center">
      {article.sources.slice(0, limit).map((source, index) => (
        <div
          key={`${article.id}-source-${source}-${index}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-inverse-surface/20 bg-surface-container-lowest"
          style={{ marginLeft: index > 0 ? -10 : 0, zIndex: 10 - index }}
        >
          <span className="text-[9px] font-bold text-on-surface">{source.slice(0, 2).toUpperCase()}</span>
        </div>
      ))}
      {article.sources.length > limit && (
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full border border-inverse-surface/20 bg-surface-container-high"
          style={{ marginLeft: -10, zIndex: 5 }}
        >
          <span className="text-[9px] font-bold text-on-surface-variant">+{article.sources.length - limit}</span>
        </div>
      )}
    </div>
  );

  if (variant === 'compact') {
    return (
      <article className="group relative flex min-w-0 gap-4">
        <div
          onClick={handleArticleClick}
          className="relative aspect-square w-20 shrink-0 cursor-pointer overflow-hidden border border-outline-variant/15 shadow-md sm:w-24"
          style={organicShapeStyle(shape.imageCard)}
        >
          <ImageWithFallback
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            {...imageProps}
          />
        </div>

        <div onClick={handleArticleClick} className="flex min-w-0 flex-1 cursor-pointer flex-col justify-between py-1">
          <div className="min-w-0">
            <div className="mb-1 text-xs uppercase tracking-wider text-outline">{article.category}</div>
            <h3 className="truncate-2 text-base leading-tight text-on-surface transition-colors group-hover:text-primary sm:text-lg">
              {article.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-outline">
            <span>{article.readTime}</span>
            {hasAudio ? <Headphones className="h-3 w-3" /> : null}
          </div>
        </div>

        <div className="absolute right-0 top-0">
          <button
            onClick={handleSaveToggle}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
              isSaved ? 'text-primary' : 'text-outline hover:text-on-surface'
            }`}
          >
            {isSaved ? <Bookmark className="h-4 w-4" fill="currentColor" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </article>
    );
  }

  if (variant === 'grid') {
    return (
      <article
        onClick={handleArticleClick}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        className={`group flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-outline-variant/15 bg-surface-container-lowest/80 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-outline-variant/25 hover:shadow-xl ${
          pressed ? 'scale-[0.99]' : ''
        }`}
      >
        <div
          className="relative aspect-[16/10] overflow-hidden border-b border-outline-variant/10"
          style={organicShapeStyle(shape.imageCard)}
        >
          <ImageWithFallback
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            {...imageProps}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/50 via-transparent to-transparent" />
          <SaveButton className="right-3 top-3" />
          {hasAudio ? (
            <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest/90">
              <Headphones className="h-3.5 w-3.5 text-on-surface" />
            </div>
          ) : null}
          <SourceBadges limit={3} />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-outline">
            <span>{article.category}</span>
            <span>&middot;</span>
            <span>{article.readTime}</span>
          </div>
          <h3 className="truncate-2 font-[family-name:var(--font-headline)] text-xl leading-tight text-on-surface transition-colors group-hover:text-primary">
            {article.title}
          </h3>
          <p className="mt-3 truncate-2 text-sm leading-relaxed text-on-surface-variant">{article.excerpt}</p>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`relative flex flex-col gap-5 transition-transform duration-150 ${pressed ? 'scale-[0.99]' : ''}`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
    >
      <div
        onClick={handleArticleClick}
        className={`group relative w-full cursor-pointer overflow-hidden border border-outline-variant/15 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${
          isFeatured ? 'h-[300px] lg:h-[420px]' : 'h-[300px]'
        }`}
        style={organicShapeStyle(shape.imageHero)}
      >
        <ImageWithFallback
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          {...imageProps}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/70 via-inverse-surface/10 to-transparent" />
        <SaveButton />
        {hasAudio ? (
          <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest/90 shadow-sm">
            <Headphones className="h-4 w-4 text-on-surface" />
          </div>
        ) : null}
        <SourceBadges />
      </div>

      <div onClick={handleArticleClick} className="cursor-pointer px-1">
        <h3
          className={`truncate-2 font-[family-name:var(--font-headline)] leading-tight text-on-surface ${
            isFeatured ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'
          }`}
        >
          {article.title}
        </h3>
        <p className="mt-2 truncate-2 text-sm leading-relaxed text-on-surface-variant lg:text-base">{article.excerpt}</p>
        <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-outline">
          <span>{article.category}</span>
          <span>&middot;</span>
          <span>{article.readTime}</span>
          {hasAudio ? <Headphones className="h-3 w-3" /> : null}
        </div>
      </div>
    </article>
  );
}
