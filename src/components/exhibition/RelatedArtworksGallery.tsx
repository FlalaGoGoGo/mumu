import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArtworksRaw, useArtists, useMuseumsForArt } from '@/hooks/useArtworks';
import { getArtworkImageUrl } from '@/types/art';
import type { EnrichedArtwork } from '@/types/art';
import { useIsMobile } from '@/hooks/use-mobile';

interface RelatedArtworksGalleryProps {
  artworkIds: string[];
  onArtworkClick?: (artwork: EnrichedArtwork) => void;
}

export function RelatedArtworksGallery({ artworkIds, onArtworkClick }: RelatedArtworksGalleryProps) {
  const { data: artworks } = useArtworksRaw();
  const { data: artists } = useArtists();
  const { data: museums } = useMuseumsForArt();
  const isMobile = useIsMobile();
  const [page, setPage] = useState(0);

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
      if (!imageUrl) continue;

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

    return matched.sort((a, b) => {
      if (a.on_view !== b.on_view) return a.on_view ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
  }, [artworks, artists, museums, artworkIds]);

  // Responsive columns: 3 desktop, 2 medium, 1 mobile. Always 2 rows.
  const cols = isMobile ? 1 : 3;
  const perPage = cols * 2;
  const totalPages = Math.max(1, Math.ceil(enrichedRelated.length / perPage));

  // Clamp page
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = enrichedRelated.slice(safePage * perPage, safePage * perPage + perPage);

  if (enrichedRelated.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground tracking-wide uppercase">
          Related Artworks
        </h3>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {safePage + 1}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Total of {enrichedRelated.length} artworks.
      </p>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {pageItems.map((artwork) => (
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
  );
}
