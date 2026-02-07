import { useNavigate } from 'react-router-dom';
import { Palette, Heart, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getArtworkImageUrl } from '@/types/art';
import type { EnrichedArtwork } from '@/types/art';
import { cn } from '@/lib/utils';

interface ArtworkShelfProps {
  artworks: EnrichedArtwork[];
  onRemoveArtwork: (artworkId: string) => void;
}

export function ArtworkShelf({ artworks, onRemoveArtwork }: ArtworkShelfProps) {
  const navigate = useNavigate();

  if (artworks.length === 0) {
    return (
      <div className="gallery-card text-center py-10">
        <Palette className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm mb-4">
          No artworks collected yet. Browse artworks and tap the heart icon to add them!
        </p>
        <Button onClick={() => navigate('/art')} size="sm">
          <ImageIcon className="w-4 h-4 mr-1.5" />
          Browse Artworks
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {artworks.map((artwork) => {
        const imageUrl = getArtworkImageUrl(artwork);
        return (
          <div
            key={artwork.artwork_id}
            className="group relative aspect-square overflow-hidden cursor-pointer border-2 border-[hsl(var(--gold-border)/0.3)] hover:border-[hsl(var(--gold-border)/0.7)] transition-colors bg-muted"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={artwork.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
              <h3 className="font-display text-[11px] font-semibold text-white leading-tight whitespace-normal break-words">
                {artwork.title}
              </h3>
              <p className="text-[10px] text-white/70 whitespace-normal break-words mt-0.5">
                {artwork.artist_name}
              </p>
              {artwork.year && (
                <p className="text-[9px] text-white/50 mt-0.5">{artwork.year}</p>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveArtwork(artwork.artwork_id);
              }}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Remove from collection"
            >
              <Heart className="w-3 h-3 fill-current" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
