import React, { useMemo, useState } from 'react';
import { IMAGES } from '../../constants/images';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  query?: string;
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

  return src;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);
  const { src, alt, style, className, query, ...rest } = props;
  const resolvedSrc = useMemo(() => resolveImageSource(src, query), [query, src]);

  const handleError = () => {
    setDidError(true);
  };

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex h-full w-full items-center justify-center">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={resolvedSrc} />
      </div>
    </div>
  ) : (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  );
}
