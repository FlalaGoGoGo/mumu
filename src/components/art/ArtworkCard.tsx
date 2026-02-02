import { useState } from 'react';
import { EnrichedArtwork } from '@/types/art';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface ArtworkCardProps {
  artwork: EnrichedArtwork;
  onClick: () => void;
}

export function ArtworkCard({ artwork, onClick }: ArtworkCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-sm border-2 border-accent/40 bg-muted transition-all hover:border-accent hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      <AspectRatio ratio={1}>
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}
        {imageError ? (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <span className="text-xs">No image</span>
          </div>
        ) : (
          <img
            src={artwork.image_url}
            alt={artwork.title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <h3 className="line-clamp-2 text-left text-sm font-medium text-white">
            {artwork.title}
          </h3>
          <p className="line-clamp-1 text-left text-xs text-white/80">
            {artwork.artist_name}
          </p>
          {artwork.museum_name && (
            <p className="line-clamp-1 text-left text-[10px] font-light text-white/60">
              {artwork.museum_name}
            </p>
          )}
        </div>
      </AspectRatio>
    </button>
  );
}
