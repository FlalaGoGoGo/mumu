import { useState, useMemo, useEffect } from 'react';
import { EnrichedArtwork, getArtworkImageUrl } from '@/types/art';
import { useImageLoad } from '@/contexts/ImageLoadContext';
import { useLanguage } from '@/lib/i18n';

interface ArtGalleryTileProps {
  artwork: EnrichedArtwork;
  onClick?: () => void;
}

export function ArtGalleryTile({ artwork, onClick }: ArtGalleryTileProps) {
  const [imageError, setImageError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const { reportImageLoaded, reportImageFailed } = useImageLoad();
  const { t } = useLanguage();

  const imageUrl = useMemo(() => {
    if (useFallback && artwork.image_url && artwork.image_url.trim()) {
      return artwork.image_url;
    }
    return getArtworkImageUrl(artwork);
  }, [artwork.image_cached_url, artwork.image_url, useFallback]);

  useEffect(() => {
    if (!imageUrl) {
      reportImageFailed(artwork.artwork_id);
    }
  }, [imageUrl, artwork.artwork_id, reportImageFailed]);

  const handleImageError = () => {
    if (!useFallback && artwork.image_url && artwork.image_url.trim() && artwork.image_cached_url) {
      setUseFallback(true);
    } else {
      setImageError(true);
      reportImageFailed(artwork.artwork_id);
    }
  };

  const showOnView = artwork.on_view;
  const showMustSee = artwork.highlight;

  return (
    <button
      className="group relative flex flex-col text-left w-full rounded-sm overflow-hidden bg-card border border-border shadow-[0_1px_3px_hsl(var(--foreground)/0.04)] transition-shadow duration-200 hover:shadow-[0_4px_12px_hsl(var(--foreground)/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-pointer"
      onClick={onClick}
      aria-label={artwork.title}
    >
      {/* Square image */}
      <div className="relative w-full aspect-square bg-muted">
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={artwork.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onLoad={() => reportImageLoaded(artwork.artwork_id)}
            onError={handleImageError}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/50">No image</span>
          </div>
        )}

        {/* Overlay badges */}
        {(showOnView || showMustSee) && (
          <div className="absolute top-1.5 left-1.5 z-[2] flex flex-col gap-1">
            {showMustSee && (
              <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none bg-accent/85 text-accent-foreground backdrop-blur-[6px] border border-white/25 shadow-sm">
                ★ {t('art.mustSee')}
              </span>
            )}
            {showOnView && (
              <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none bg-primary/80 text-primary-foreground backdrop-blur-[6px] border border-white/25 shadow-sm">
                {t('art.onView')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Text info */}
      <div className="px-1.5 py-1.5 flex flex-col gap-0">
        <h3 className="text-xs font-semibold text-foreground leading-tight truncate">
          {artwork.title}
        </h3>
        <p className="text-[10px] text-muted-foreground truncate leading-tight">
          {artwork.artist_name}{artwork.year ? ` · ${artwork.year}` : ''}
        </p>
      </div>
    </button>
  );
}
