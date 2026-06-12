import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bookmark, Lock } from 'lucide-react';
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

export function ArticleCard({ article, variant = 'default', onClick }: ArticleCardProps) {
  const navigate = useNavigate();
  const { saveArticle, unsaveArticle, isArticleSaved, savedCount } = useSavedArticles();
  const { maxSaves, hasUnlimitedSaves } = useSubscription();
  const { success, error, warning } = useToast();
  const [isHovering, setIsHovering] = useState(false);

  const isSaved = isArticleSaved(article.id);
  const canSave = hasUnlimitedSaves || savedCount < maxSaves;

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

  const SaveButton = () => (
    <button
      onClick={handleSaveToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-all ${
        isSaved
          ? 'border border-primary/30 bg-surface-container-lowest/95 text-primary shadow-lg'
          : 'border border-outline-variant/30 bg-surface-container-lowest/70 text-on-surface-variant shadow-md hover:bg-surface-container-lowest/95 hover:text-primary'
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
          <div className="text-xs text-outline">{article.readTime}</div>
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
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-outline-variant/15 bg-surface-container-lowest/75 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-outline-variant/25 hover:shadow-xl"
      >
        <div className="relative aspect-[16/9] overflow-hidden border-b border-outline-variant/10">
          <ImageWithFallback
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            {...imageProps}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/20 to-transparent opacity-70" />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-outline">
            <span>{article.category}</span>
            <span>&middot;</span>
            <span>{article.readTime}</span>
          </div>
          <h3 className="truncate-2 font-[family-name:var(--font-headline)] text-xl leading-tight text-on-surface transition-colors group-hover:text-primary">
            {article.title}
          </h3>
          <p className="mt-3 truncate-2 text-sm leading-relaxed text-on-surface-variant">
            {article.excerpt}
          </p>

          <div className="mt-auto flex items-center justify-between gap-4 pt-5">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex -space-x-1.5">
                {article.sources.slice(0, 4).map((source, index) => (
                  <div
                    key={`${article.id}-grid-${source}-${index}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface"
                  >
                    <span className="text-[8px] font-bold text-on-surface">{source}</span>
                  </div>
                ))}
              </div>
              <span className="truncate text-xs text-outline">
                {article.sources.length} sources
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveToggle}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                isSaved
                  ? 'border-primary/30 bg-primary-container text-primary'
                  : 'border-outline-variant/25 text-outline hover:bg-surface-container hover:text-on-surface'
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
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article className="relative cursor-pointer">
        <div
          onClick={handleArticleClick}
          className="group relative mb-4 h-[300px] w-full overflow-hidden border border-outline-variant/15 shadow-xl lg:h-[520px]"
          style={organicShapeStyle(shape.imageHero)}
        >
          <ImageWithFallback
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            {...imageProps}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/70 to-transparent" />
          <SaveButton />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="mb-3 flex flex-wrap gap-1">
              <div className="flex -space-x-2">
                {article.sources.slice(0, 8).map((source, index) => (
                  <div
                    key={`${article.id}-featured-${source}-${index}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface"
                  >
                    <span className="text-[8px] font-bold text-on-surface">{source}</span>
                  </div>
                ))}
              </div>
            </div>
            <h3 className="text-2xl leading-tight text-on-surface lg:text-4xl">{article.title}</h3>
          </div>
        </div>

        <div onClick={handleArticleClick} className="px-2">
          <p className="mb-3 line-clamp-2 leading-relaxed text-on-surface-variant opacity-80">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-outline">
            <span>{article.category}</span>
            <span>&middot;</span>
            <span>{article.readTime}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="relative flex flex-col gap-6">
      <div
        onClick={handleArticleClick}
        className="group relative h-[300px] w-full cursor-pointer overflow-hidden border border-outline-variant/15 shadow-xl"
        style={organicShapeStyle(shape.imageHero)}
      >
        <ImageWithFallback
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          {...imageProps}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/70 to-transparent" />
        <SaveButton />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="mb-3 flex flex-wrap gap-1">
            <div className="flex -space-x-2">
              {article.sources.slice(0, 8).map((source, index) => (
                <div
                  key={`${article.id}-default-${source}-${index}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface"
                >
                  <span className="text-[8px] font-bold text-on-surface">{source}</span>
                </div>
              ))}
            </div>
          </div>
          <h4 className="text-2xl leading-tight text-on-surface">{article.title}</h4>
        </div>
      </div>

      <div onClick={handleArticleClick} className="cursor-pointer px-2">
        <p className="mb-3 line-clamp-2 leading-relaxed text-on-surface-variant opacity-80">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-outline">
          <span>{article.category}</span>
          <span>&middot;</span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </article>
  );
}
