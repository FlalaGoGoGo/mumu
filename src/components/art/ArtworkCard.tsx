import { useState, useMemo, useEffect } from 'react';
import { EnrichedArtwork, getArtworkImageUrl } from '@/types/art';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { useImageLoad } from '@/contexts/ImageLoadContext';

interface ArtworkCardProps {
  artwork: EnrichedArtwork;
  onClick: () => void;
  compact?: boolean;
}

export function ArtworkCard({ artwork, onClick, compact = false }: ArtworkCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const { reportImageLoaded, reportImageFailed } = useImageLoad();

  // Get the best available image URL
  const imageUrl = useMemo(() => {
    if (useFallback && artwork.image_url && artwork.image_url.trim()) {
      // Try source URL as fallback
      return artwork.image_url;
    }
    return getArtworkImageUrl(artwork);
  }, [artwork.image_cached_url, artwork.image_url, useFallback]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    reportImageLoaded(artwork.artwork_id);
  };

  const handleImageError = () => {
    if (!useFallback && artwork.image_url && artwork.image_url.trim() && artwork.image_cached_url) {
      // If cached URL failed and we have a source URL, try it
      setUseFallback(true);
      setImageLoaded(false);
    } else {
      setImageError(true);
      reportImageFailed(artwork.artwork_id);
    }
  };

  // Report failure immediately if there's no URL to try
  useEffect(() => {
    if (!imageUrl) {
      reportImageFailed(artwork.artwork_id);
    }
  }, [imageUrl, artwork.artwork_id, reportImageFailed]);

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-sm border-2 border-accent/40 bg-muted transition-all hover:border-accent hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      <AspectRatio ratio={1}>
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        {imageError || !imageUrl ? (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <span className="text-xs">No image</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={artwork.title}
            loading="lazy"
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        
        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          compact ? "p-2" : "p-3"
        )}>
          <h3 className={cn(
            "line-clamp-2 text-left font-medium text-white",
            compact ? "text-xs leading-tight" : "text-sm"
          )}>
            {artwork.title}
          </h3>
          <p className={cn(
            "text-left text-white/80 mt-0.5",
            compact ? "text-[10px] leading-tight" : "text-xs"
          )}>
            {artwork.artist_name}
          </p>
          {artwork.museum_name && (
            <p className={cn(
              "text-left font-light text-white/60 mt-0.5",
              compact ? "text-[9px] leading-tight line-clamp-2" : "text-[10px] line-clamp-1"
            )}>
              {artwork.museum_name}
            </p>
          )}
        </div>
      </AspectRatio>
    </button>
  );
}
