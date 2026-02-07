import { useMemo } from 'react';
import { ImageOff } from 'lucide-react';
import { useArtworksRaw, useArtists, useMuseumsForArt } from '@/hooks/useArtworks';
import { getArtworkImageUrl } from '@/types/art';
import type { EnrichedArtwork } from '@/types/art';

interface RelatedArtworksGalleryProps {
  artworkIds: string[];
  /** Called when user clicks a thumbnail. Parent is responsible for opening the artwork detail. */
  onArtworkClick?: (artwork: EnrichedArtwork) => void;
}

export function RelatedArtworksGallery({ artworkIds, onArtworkClick }: RelatedArtworksGalleryProps) {
  const { data: artworks } = useArtworksRaw();
  const { data: artists } = useArtists();
  const { data: museums } = useMuseumsForArt();

  const enrichedRelated = useMemo(() => {
    if (!artworks || !artists || !museums || artworkIds.length === 0) return [];

    const artistById = new Map(artists.map(a => [a.artist_id, a]));
    const museumById = new Map(museums.map(m => [m.museum_id, m]));

    const matched: EnrichedArtwork[] = [];

    for (const id of artworkIds) {
      const artwork = artworks.find(a => a.artwork_id === id);
      if (!artwork) continue;

      const artist = artistById.get(artwork.artist_id);
      const museum = museumById.get(artwork.museum_id);
      if (!artist || !museum) continue;

      const imageUrl = getArtworkImageUrl(artwork);
      if (!imageUrl) continue; // skip artworks without images

      matched.push({
        ...artwork,
        artist_name: artist.artist_name,
        artist_portrait_url: artist.portrait_url,
        museum_name: museum.name,
        museum_address: museum.address,
        museum_lat: museum.lat,
        museum_lng: museum.lng,
      });
    }

    // Sort: on_view=true first, then title A→Z
    return matched.sort((a, b) => {
      if (a.on_view !== b.on_view) return a.on_view ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
  }, [artworks, artists, museums, artworkIds]);

  if (enrichedRelated.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h3 className="font-display text-sm font-semibold text-foreground tracking-wide uppercase">
        Related Artworks
      </h3>
      <div className="max-h-[240px] overflow-y-auto -mx-1 px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {enrichedRelated.map((artwork) => (
            <button
              key={artwork.artwork_id}
              onClick={() => onArtworkClick?.(artwork)}
              className="group relative w-full aspect-square rounded-sm overflow-hidden bg-muted border border-[hsl(var(--gold-border))] shadow-[0_1px_3px_hsl(var(--foreground)/0.04)] transition-all duration-200 hover:border-[hsl(var(--gold-border-light))] hover:shadow-[0_4px_12px_hsl(var(--foreground)/0.08)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-pointer"
            >
              <img
                src={getArtworkImageUrl(artwork)!}
                alt={artwork.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Hover overlay — dark with title + museum */}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/60 group-focus-visible:bg-foreground/60 transition-colors duration-200 flex flex-col items-start justify-end w-full text-left px-2 pb-1.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                <h4 className="font-display text-[10px] font-semibold text-white leading-tight whitespace-normal break-words">
                  {artwork.title}
                </h4>
                <p className="text-[9px] text-white/70 leading-tight whitespace-normal break-words mt-0.5">
                  {artwork.museum_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
