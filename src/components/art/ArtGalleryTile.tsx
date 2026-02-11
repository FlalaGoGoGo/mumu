import { useState, useMemo, useEffect } from 'react';
import { EnrichedArtwork, getArtworkImageUrl } from '@/types/art';
import { useImageLoad } from '@/contexts/ImageLoadContext';

interface ArtGalleryTileProps {
  artwork: EnrichedArtwork;
  onClick?: () => void;
}

export function ArtGalleryTile({ artwork, onClick }: ArtGalleryTileProps) {
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

  return (
    <button
      className="group relative w-full aspect-square rounded-sm overflow-hidden bg-muted border border-border shadow-[0_1px_3px_hsl(var(--foreground)/0.04)] transition-shadow duration-200 hover:shadow-[0_4px_12px_hsl(var(--foreground)/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-pointer"
      onClick={onClick}
      aria-label={artwork.title}
    >
      {/* Square image — no badges, no text below */}
      {!imageError && imageUrl ? (
        <img
          src={imageUrl}
          alt={artwork.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onLoad={() => reportImageLoaded(artwork.artwork_id)}
          onError={handleImageError}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground/50">No image</span>
        </div>
      )}

      {/* Hover overlay — dark with title + artist */}
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 group-focus-visible:bg-foreground/60 transition-colors duration-200 flex flex-col justify-end px-2.5 pb-2.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
        <h3 className="text-xs font-semibold text-white leading-tight line-clamp-2">
          {artwork.title}
        </h3>
        <p className="text-[10px] text-white/70 leading-tight truncate mt-0.5">
          {artwork.artist_name}
        </p>
      </div>
    </button>
  );
}
