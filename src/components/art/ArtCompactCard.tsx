import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EnrichedArtwork, getArtworkImageUrl } from '@/types/art';
import { useImageLoad } from '@/contexts/ImageLoadContext';

interface ArtCompactCardProps {
  artwork: EnrichedArtwork;
  onClick?: () => void;
}

export function ArtCompactCard({ artwork, onClick }: ArtCompactCardProps) {
  const [imageError, setImageError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const { reportImageLoaded, reportImageFailed } = useImageLoad();

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Card
      className="overflow-hidden flex flex-col bg-card border border-border rounded-sm shadow-[0_1px_3px_hsl(var(--foreground)/0.04)] transition-shadow duration-200 hover:shadow-[0_4px_12px_hsl(var(--foreground)/0.08)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={artwork.title}
    >
      {/* Cover Image - short banner 16:5 */}
      <div className="relative w-full flex-shrink-0" style={{ aspectRatio: '16 / 5' }}>
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
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground/50">No image</span>
          </div>
        )}
      </div>

      <CardContent className="p-2.5 flex flex-col gap-0.5">
        {/* Title - max 2 lines */}
        <h3 className="font-display text-sm font-semibold text-foreground leading-snug line-clamp-2">
          {artwork.title}
        </h3>
        {/* Artist + year - 1 line */}
        <p className="text-xs text-muted-foreground truncate leading-tight">
          {artwork.artist_name}{artwork.year ? ` · ${artwork.year}` : ''}
        </p>
      </CardContent>
    </Card>
  );
}
