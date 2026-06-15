import React, { useMemo, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { IMAGES } from '../../constants/images';
import { optimizedImageUrl } from '../../../lib/images';

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  query?: string;
  /** Target display width hint for the image CDN (defaults to 800). */
  cdnWidth?: number;
};

function resolveImageSource(src?: string, query?: string) {
  if (src) {
    return src;
  }

  const normalized = query?.toLowerCase().trim() ?? '';

  if (!normalized) {
    return src;
  }

  if (normalized.includes('abstract glass sculpture')) return IMAGES.hero.welcome;
  if (normalized.includes('professional portrait person smiling')) return IMAGES.profile.main;
  if (normalized.includes('business woman professional headshot')) return IMAGES.profile.woman;
  if (normalized.includes('professional man portrait casual')) return IMAGES.profile.casual;
  if (normalized.includes('luxury product elegant design')) return IMAGES.ad;
  if (normalized.includes('modern architecture shadows geometric')) return IMAGES.editorial.economy;
  if (normalized.includes('futuristic circuit board technology dark')) return IMAGES.editorial.technology;
  if (normalized.includes('climate environment nature earth')) return IMAGES.briefs.climate;
  if (normalized.includes('culture art museum gallery')) return IMAGES.editorial.brief;
  if (normalized.includes('health wellness medicine medical')) return IMAGES.profile.woman;
  if (normalized.includes('politics government capitol building')) return IMAGES.editorial.avatar;
  if (normalized.includes('science research laboratory discovery')) return IMAGES.hero.welcome;

  return IMAGES.editorial.brief;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);
  const { src, alt, style, className, query, cdnWidth = 800, ...rest } = props;
  const resolvedSrc = useMemo(
    () => optimizedImageUrl(resolveImageSource(src, query), cdnWidth),
    [query, src, cdnWidth],
  );

  if (didError || !resolvedSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-container text-outline ${className ?? ''}`}
        style={style}
        role="img"
        aria-label={alt || 'Image unavailable'}
      >
        <ImageIcon className="h-[28%] w-[28%] min-h-5 min-w-5 opacity-40" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      {...rest}
      onError={() => setDidError(true)}
    />
  );
}
