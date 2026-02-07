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
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {enrichedRelated.map((artwork) => (
            <button
              key={artwork.artwork_id}
              onClick={() => onArtworkClick?.(artwork)}
              className="relative aspect-square overflow-hidden rounded-sm bg-muted group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={getArtworkImageUrl(artwork)!}
                alt={artwork.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-200 flex items-end p-1.5 opacity-0 group-hover:opacity-100">
                <div className="text-left">
                  <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2">
                    {artwork.title}
                  </p>
                  <p className="text-white/75 text-[10px] leading-tight line-clamp-1 mt-0.5">
                    {artwork.museum_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
