import { useMemo, useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { ArrowRight, CalendarRange, ExternalLink, Image as ImageIcon, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getArtworkImageUrl } from '@/types/art';
import { getMuseumDisplayName } from '@/lib/humanizeMuseumId';
import type { ArtworkMovement } from '@/types/movement';
import type { EnrichedArtwork } from '@/types/art';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface RouteData {
  key: string;
  lender_museum_id: string;
  borrower_museum_id: string;
  lender_name: string;
  borrower_name: string;
  event_count: number;
  unique_artworks: string[];
  min_year: number;
  max_year: number;
  sample_titles: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: RouteData | null;
  movements: ArtworkMovement[];
  artworks: EnrichedArtwork[];
  museumMap: Map<string, MuseumPoint>;
  onArtworkSelect: (artworkId: string) => void;
}

export function RouteDetailDrawer({ open, onOpenChange, route, movements, artworks, museumMap, onArtworkSelect }: Props) {
  if (!route) return null;

  const lenderName = getMuseumDisplayName(route.lender_museum_id, museumMap);
  const borrowerName = getMuseumDisplayName(route.borrower_museum_id, museumMap);

  // All movements for this route
  const routeMovements = useMemo(() =>
    movements.filter(m =>
      m.lender_museum_id === route.lender_museum_id &&
      m.borrower_museum_id === route.borrower_museum_id
    ).sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '')),
    [movements, route]
  );

  // Artworks involved
  const routeArtworks = useMemo(() => {
    const artworkMap = new Map(artworks.map(a => [a.artwork_id, a]));
    return route.unique_artworks
      .map(id => artworkMap.get(id))
      .filter(Boolean) as EnrichedArtwork[];
  }, [artworks, route.unique_artworks]);

  // Year distribution
  const yearDistribution = useMemo(() => {
    const yearMap = new Map<number, number>();
    for (const m of routeMovements) {
      if (!m.start_date) continue;
      const y = parseInt(m.start_date.substring(0, 4));
      if (!isNaN(y)) yearMap.set(y, (yearMap.get(y) || 0) + 1);
    }
    return Array.from(yearMap.entries()).sort(([a], [b]) => a - b);
  }, [routeMovements]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader className="text-left space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                <span>Route Detail</span>
              </div>
              <SheetTitle className="font-display text-lg leading-tight">
                <span className="text-foreground">{lenderName}</span>
                <ArrowRight className="inline h-4 w-4 mx-2 text-muted-foreground" />
                <span className="text-foreground">{borrowerName}</span>
              </SheetTitle>
              <SheetDescription className="text-sm">
                {route.event_count} movement events · {route.unique_artworks.length} artworks
                {route.min_year > 0 && ` · ${route.min_year}–${route.max_year}`}
              </SheetDescription>
            </SheetHeader>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <CalendarRange className="h-3 w-3" />
                {route.min_year > 0 ? `${route.min_year}–${route.max_year}` : 'Unknown period'}
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <ImageIcon className="h-3 w-3" />
                {route.unique_artworks.length} artworks
              </Badge>
            </div>

            {/* Year distribution */}
            {yearDistribution.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Activity Over Time
                </h4>
                <div className="flex items-end gap-px h-16">
                  {yearDistribution.map(([year, count]) => {
                    const maxCount = Math.max(...yearDistribution.map(([, c]) => c));
                    const height = Math.max(4, (count / maxCount) * 100);
                    return (
                      <div key={year} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full rounded-t bg-primary/60 group-hover:bg-primary transition-colors min-w-[3px]"
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute -top-8 bg-background border rounded px-2 py-0.5 text-[10px] font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {year}: {count} events
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                  <span>{yearDistribution[0][0]}</span>
                  <span>{yearDistribution[yearDistribution.length - 1][0]}</span>
                </div>
              </div>
            )}

            {/* Artworks grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Artworks on This Route ({routeArtworks.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {routeArtworks.map(artwork => {
                  const imageUrl = getArtworkImageUrl(artwork);
                  return (
                    <button
                      key={artwork.artwork_id}
                      onClick={() => onArtworkSelect(artwork.artwork_id)}
                      className="group text-left rounded-lg border border-border/60 overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
                    >
                      <div className="aspect-square bg-muted overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={artwork.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {artwork.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{artwork.year || ''}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Movement timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Movement Timeline ({routeMovements.length} events)
              </h4>
              <div className="space-y-0 relative">
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />
                {routeMovements.map((m, i) => (
                  <div
                    key={m.movement_id}
                    className="flex gap-3 py-2.5 relative cursor-pointer hover:bg-muted/40 rounded-lg px-1 -mx-1 transition-colors"
                    onClick={() => onArtworkSelect(m.artwork_id)}
                  >
                    <div className="shrink-0 z-10">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border-2 border-background">
                        {i + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium truncate">{m.artwork_title || m.artwork_id}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {m.start_date} – {m.end_date}
                      </p>
                      {m.related_exhibition_name && (
                        <p className="text-xs italic text-muted-foreground truncate">
                          {m.related_exhibition_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          m.confidence === 'HIGH' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : m.confidence === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {m.confidence}
                        </span>
                        <span className="text-muted-foreground capitalize">{m.movement_type}</span>
                        {m.source_url && (
                          <a
                            href={m.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-primary hover:underline ml-auto"
                            onClick={e => e.stopPropagation()}
                          >
                            Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
