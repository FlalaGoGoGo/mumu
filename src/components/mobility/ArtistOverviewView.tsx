import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowRightLeft, MapPin, Landmark, CalendarRange, ChevronRight, Image as ImageIcon, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnimatedPolyline } from './AnimatedPolyline';
import { RouteDetailDrawer, type RouteData } from './RouteDetailDrawer';
import { getArtworkImageUrl } from '@/types/art';
import { getMuseumDisplayName } from '@/lib/humanizeMuseumId';
import { getCountryFlag } from '@/lib/countryFlag';
import type { ArtworkMovement } from '@/types/movement';
import type { EnrichedArtwork, Artist } from '@/types/art';
import type { Museum } from '@/types/museum';
import 'leaflet/dist/leaflet.css';

/** MuMu gold from --accent token: hsl(43, 60%, 45%) */
const GOLD = 'hsl(43, 60%, 45%)';
const GOLD_RING = 'hsl(43, 65%, 38%)';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

interface CorridorData extends RouteData {
  from: [number, number];
  to: [number, number];
}

interface Props {
  movements: ArtworkMovement[];
  museumMap: Map<string, MuseumPoint>;
  artworks: EnrichedArtwork[];
  onDrillDown: (artworkId: string) => void;
  selectedArtist?: Artist | null;
  museums?: Museum[];
}

function createArc(from: [number, number], to: [number, number], segments = 30): [number, number][] {
  const points: [number, number][] = [];
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dist = Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2));
  const offset = dist * 0.2;
  const dx = to[1] - from[1];
  const dy = -(to[0] - from[0]);
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const controlLat = midLat + (dy / len) * offset;
  const controlLng = midLng + (dx / len) * offset;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * controlLat + t * t * to[0];
    const lng = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * controlLng + t * t * to[1];
    points.push([lat, lng]);
  }
  return points;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [points, map]);
  return null;
}

/** Map zoom controller for route hover - zooms more aggressively for short routes */
function MapHoverFocus({ corridor, allPoints }: { corridor: CorridorData | null; allPoints: [number, number][] }) {
  const map = useMap();
  const defaultBoundsRef = useRef<L.LatLngBounds | null>(null);

  useEffect(() => {
    if (allPoints.length > 1 && !defaultBoundsRef.current) {
      defaultBoundsRef.current = L.latLngBounds(allPoints.map(p => L.latLng(p[0], p[1])));
    }
  }, [allPoints]);

  useEffect(() => {
    if (corridor) {
      const bounds = L.latLngBounds([
        L.latLng(corridor.from[0], corridor.from[1]),
        L.latLng(corridor.to[0], corridor.to[1]),
      ]);
      // For short-distance routes, zoom much more aggressively
      const dist = Math.sqrt(
        Math.pow(corridor.from[0] - corridor.to[0], 2) +
        Math.pow(corridor.from[1] - corridor.to[1], 2)
      );
      const maxZoom = dist < 0.5 ? 14 : dist < 2 ? 12 : dist < 5 ? 10 : 8;
      map.flyToBounds(bounds, { padding: [100, 100], maxZoom, duration: 0.5 });
    } else if (defaultBoundsRef.current) {
      map.flyToBounds(defaultBoundsRef.current, { padding: [40, 40], maxZoom: 8, duration: 0.5 });
    }
  }, [corridor, map]);

  return null;
}

/** Stacked artwork thumbnails for a route */
function ArtworkStack({ artworkIds, artworks, maxShow = 4 }: { artworkIds: string[]; artworks: EnrichedArtwork[]; maxShow?: number }) {
  const artworkMap = useMemo(() => new Map(artworks.map(a => [a.artwork_id, a])), [artworks]);
  const shown = artworkIds.slice(0, maxShow);
  const remaining = artworkIds.length - shown.length;

  return (
    <div className="flex -space-x-2.5 shrink-0">
      {shown.map((id, i) => {
        const artwork = artworkMap.get(id);
        const imageUrl = artwork ? getArtworkImageUrl(artwork) : null;
        return (
          <div key={id} className="w-9 h-9 rounded-md border-2 border-background bg-muted overflow-hidden shadow-sm" style={{ zIndex: maxShow - i }}>
            {imageUrl ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-3.5 w-3.5 text-muted-foreground/40" /></div>
            )}
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="w-9 h-9 rounded-md border-2 border-background bg-muted flex items-center justify-center shadow-sm">
          <span className="text-[10px] font-semibold text-muted-foreground">+{remaining}</span>
        </div>
      )}
    </div>
  );
}

/** Artist profile summary card */
function ArtistProfileCard({ artist }: { artist: Artist }) {
  const flag = getCountryFlag(artist.nationality);
  const lifeSpan = [artist.birth_year, artist.death_year].filter(Boolean).join('–');

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-4 flex items-start gap-4">
        {artist.portrait_url ? (
          <img src={artist.portrait_url} alt={artist.artist_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-border/60 shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border/60 shrink-0">
            <User className="h-7 w-7 text-muted-foreground/40" />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold truncate">{flag} {artist.artist_name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {artist.nationality && <Badge variant="secondary" className="text-[10px]">{artist.nationality}</Badge>}
            {lifeSpan && <span className="text-xs text-muted-foreground tabular-nums">{lifeSpan}</span>}
            {artist.movement && <Badge variant="outline" className="text-[10px]">{artist.movement}</Badge>}
          </div>
          {artist.bio && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{artist.bio}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/** Get museum country for flag display */
function getMuseumCountry(museumId: string, museums?: Museum[]): string | null {
  if (!museums) return null;
  const m = museums.find(m => m.museum_id === museumId);
  return m?.country || null;
}

export function ArtistOverviewView({ movements, museumMap, artworks, onDrillDown, selectedArtist, museums }: Props) {
  const isMobile = useIsMobile();
  const [highlightedCorridor, setHighlightedCorridor] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);

  const { corridors, allPoints, involvedMuseums, maxEvents, museumEventCounts } = useMemo(() => {
    const corridorMap = new Map<string, {
      lender_museum_id: string; borrower_museum_id: string;
      artworkIds: Set<string>; titles: Set<string>; years: number[]; count: number;
    }>();
    const museumCounts = new Map<string, number>();

    for (const m of movements) {
      const key = `${m.lender_museum_id}__${m.borrower_museum_id}`;
      if (!corridorMap.has(key)) {
        corridorMap.set(key, { lender_museum_id: m.lender_museum_id, borrower_museum_id: m.borrower_museum_id, artworkIds: new Set(), titles: new Set(), years: [], count: 0 });
      }
      const c = corridorMap.get(key)!;
      c.count++;
      c.artworkIds.add(m.artwork_id);
      if (m.artwork_title) c.titles.add(m.artwork_title);
      if (m.start_date) { const y = parseInt(m.start_date.substring(0, 4)); if (!isNaN(y)) c.years.push(y); }
      museumCounts.set(m.lender_museum_id, (museumCounts.get(m.lender_museum_id) || 0) + 1);
      museumCounts.set(m.borrower_museum_id, (museumCounts.get(m.borrower_museum_id) || 0) + 1);
    }

    const corridors: CorridorData[] = [];
    const allPts: [number, number][] = [];
    const involved = new Map<string, MuseumPoint>();
    let maxEvents = 1;

    for (const [key, c] of corridorMap) {
      const from = museumMap.get(c.lender_museum_id);
      const to = museumMap.get(c.borrower_museum_id);
      if (!from || !to || (from.lat === 0 && from.lng === 0) || (to.lat === 0 && to.lng === 0)) continue;
      corridors.push({
        key, lender_museum_id: c.lender_museum_id, borrower_museum_id: c.borrower_museum_id,
        lender_name: getMuseumDisplayName(c.lender_museum_id, museumMap),
        borrower_name: getMuseumDisplayName(c.borrower_museum_id, museumMap),
        from: [from.lat, from.lng], to: [to.lat, to.lng],
        event_count: c.count, unique_artworks: Array.from(c.artworkIds),
        min_year: c.years.length > 0 ? Math.min(...c.years) : 0,
        max_year: c.years.length > 0 ? Math.max(...c.years) : 0,
        sample_titles: Array.from(c.titles).slice(0, 5),
      });
      allPts.push([from.lat, from.lng], [to.lat, to.lng]);
      involved.set(from.museum_id, from);
      involved.set(to.museum_id, to);
      if (c.count > maxEvents) maxEvents = c.count;
    }
    return { corridors, allPoints: allPts, involvedMuseums: Array.from(involved.values()), maxEvents, museumEventCounts: museumCounts };
  }, [movements, museumMap]);

  const stats = useMemo(() => {
    const artworkIds = new Set(movements.map(m => m.artwork_id));
    const museumIds = new Set<string>();
    movements.forEach(m => { museumIds.add(m.lender_museum_id); museumIds.add(m.borrower_museum_id); });
    const years = movements.map(m => parseInt(m.start_date?.substring(0, 4) || '')).filter(y => !isNaN(y));
    return {
      totalEvents: movements.length, artworksWithMovements: artworkIds.size, museumsInvolved: museumIds.size,
      minYear: years.length > 0 ? Math.min(...years) : 0, maxYear: years.length > 0 ? Math.max(...years) : 0,
    };
  }, [movements]);

  const center: [number, number] = allPoints.length > 0
    ? [allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length, allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length]
    : [48, 2];

  const sortedCorridors = useMemo(() => [...corridors].sort((a, b) => b.event_count - a.event_count), [corridors]);

  const { topInflow, topOutflow } = useMemo(() => {
    const inflowMap = new Map<string, number>();
    const outflowMap = new Map<string, number>();
    for (const m of movements) {
      const lenderName = getMuseumDisplayName(m.lender_museum_id, museumMap);
      const borrowerName = getMuseumDisplayName(m.borrower_museum_id, museumMap);
      outflowMap.set(lenderName, (outflowMap.get(lenderName) || 0) + 1);
      inflowMap.set(borrowerName, (inflowMap.get(borrowerName) || 0) + 1);
    }
    const toRanked = (map: Map<string, number>) => Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    return { topInflow: toRanked(inflowMap), topOutflow: toRanked(outflowMap) };
  }, [movements, museumMap]);

  const handleCorridorHover = useCallback((key: string | null) => setHighlightedCorridor(key), []);

  const handleRouteClick = useCallback((corridor: CorridorData) => {
    try {
      setSelectedRoute(corridor);
    } catch {
      // Prevent crash
    }
  }, []);

  const highlightedEndpoints = useMemo(() => {
    if (!highlightedCorridor) return new Set<string>();
    const c = corridors.find(c => c.key === highlightedCorridor);
    if (!c) return new Set<string>();
    return new Set([c.lender_museum_id, c.borrower_museum_id]);
  }, [highlightedCorridor, corridors]);

  const highlightedCorridorData = useMemo(() => {
    if (!highlightedCorridor) return null;
    return corridors.find(c => c.key === highlightedCorridor) || null;
  }, [highlightedCorridor, corridors]);

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ArrowRightLeft className="h-8 w-8 mb-2" />
        <p className="font-medium">No movement data available for this selection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedArtist && <ArtistProfileCard artist={selectedArtist} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><ArrowRightLeft className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold tabular-nums">{stats.totalEvents}</p><p className="text-xs text-muted-foreground">Movement Events</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><ImageIcon className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold tabular-nums">{stats.artworksWithMovements}</p><p className="text-xs text-muted-foreground">Artworks Moved</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Landmark className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold tabular-nums">{stats.museumsInvolved}</p><p className="text-xs text-muted-foreground">Museums Involved</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><CalendarRange className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold tabular-nums">{stats.minYear > 0 ? `${stats.minYear}–${stats.maxYear}` : '—'}</p><p className="text-xs text-muted-foreground">Active Years</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Map + Top Routes */}
      <div className={cn(isMobile ? 'space-y-4' : 'grid grid-cols-5 gap-5')}>
        {/* Corridor Map */}
        <div className={cn("rounded-xl border border-border/60 overflow-hidden relative", isMobile ? '' : 'col-span-3')}
          style={{ height: isMobile ? 350 : 540 }}>
          <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
            {allPoints.length > 1 && <FitBounds points={allPoints} />}
            <MapHoverFocus corridor={highlightedCorridorData} allPoints={allPoints} />

            {/* Route lines - rendered first so they sit beneath markers */}
            {corridors.map(c => {
              const intensity = c.event_count / maxEvents;
              const isHighlighted = highlightedCorridor === c.key;
              const isDimmed = highlightedCorridor !== null && !isHighlighted;
              return (
                <AnimatedPolyline key={c.key} id={c.key}
                  positions={createArc(c.from, c.to)}
                  color={isHighlighted ? GOLD : 'hsl(348, 45%, 42%)'}
                  weight={isHighlighted ? 3 : 1 + intensity * 3}
                  opacity={isDimmed ? 0.06 : isHighlighted ? 0.9 : 0.12 + intensity * 0.4}
                  highlighted={isHighlighted}
                  animated={isHighlighted}
                />
              );
            })}

            {/* Museum markers - rendered on top of lines */}
            {involvedMuseums.map(m => {
              const isEndpoint = highlightedEndpoints.has(m.museum_id);
              const isDimmedMuseum = highlightedCorridor !== null && !isEndpoint;
              return (
                <CircleMarker key={m.museum_id} center={[m.lat, m.lng]}
                  radius={isEndpoint ? 9 : 5}
                  pathOptions={{
                    color: isEndpoint ? GOLD_RING : 'hsl(348, 55%, 38%)',
                    weight: isEndpoint ? 3 : 2,
                    fillColor: 'white',
                    fillOpacity: isDimmedMuseum ? 0.15 : 1,
                    opacity: isDimmedMuseum ? 0.15 : 1,
                  }}>
                  <Popup><span className="text-xs font-semibold">{getMuseumDisplayName(m.museum_id, museumMap)}</span></Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="absolute bottom-3 left-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg p-2.5 text-[10px] space-y-1 border border-border/60 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-[3px] rounded-full" style={{ background: GOLD }} />
              <span className="text-muted-foreground">Selected route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[2px] rounded-full" style={{ background: 'hsl(348,45%,42%)' }} />
              <span className="text-muted-foreground">Corridor</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-full border-2 bg-white" style={{ borderColor: GOLD_RING }} />
              <span className="text-muted-foreground">Active</span>
              <div className="w-3 h-3 rounded-full border-2 bg-white ml-2" style={{ borderColor: 'hsl(348,55%,38%)' }} />
              <span className="text-muted-foreground">Default</span>
            </div>
          </div>
        </div>

        {/* Top Routes Panel */}
        <Card className={cn("border-border/60 overflow-hidden", isMobile ? '' : 'col-span-2')}>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border/60">
              <h3 className="text-sm font-semibold">Top Routes</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{corridors.length} corridors · Click to explore</p>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: isMobile ? 400 : 470 }}>
              {sortedCorridors.map((c) => {
                const isActive = highlightedCorridor === c.key;
                const lenderFlag = getMuseumCountry(c.lender_museum_id, museums);
                const borrowerFlag = getMuseumCountry(c.borrower_museum_id, museums);
                return (
                  <div key={c.key}
                    className={cn("px-4 py-3.5 border-b border-border/30 cursor-pointer transition-all", isActive ? 'bg-accent/10' : 'hover:bg-muted/40')}
                    onMouseEnter={() => handleCorridorHover(c.key)}
                    onMouseLeave={() => handleCorridorHover(null)}
                    onClick={() => handleRouteClick(c)}>
                    <div className="flex items-center gap-3">
                      <ArtworkStack artworkIds={c.unique_artworks} artworks={artworks} maxShow={4} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lenderFlag ? `${getCountryFlag(lenderFlag)} ` : ''}{c.lender_name}</p>
                        <p className="text-xs text-muted-foreground truncate">→ {borrowerFlag ? `${getCountryFlag(borrowerFlag)} ` : ''}{c.borrower_name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{c.event_count}</span> events</span>
                          <span className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{c.unique_artworks.length}</span> artworks</span>
                          {c.min_year > 0 && <span className="text-xs text-muted-foreground ml-auto tabular-nums">{c.min_year}–{c.max_year}</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="mt-2.5 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(8, (c.event_count / maxEvents) * 100)}%`, background: isActive ? GOLD : 'hsl(348, 45%, 42%)', opacity: isActive ? 1 : 0.6 }} />
                    </div>
                  </div>
                );
              })}
              {sortedCorridors.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No corridors for this period</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inflow/Outflow Rankings */}
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-5'}>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3"><div className="h-2 w-2 rounded-full bg-green-500" /><h3 className="text-sm font-semibold">Top Inflow</h3></div>
            <div className="space-y-1">
              {topInflow.map((m, i) => (
                <div key={m.name} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2 min-w-0"><span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}</span><span className="truncate text-xs sm:text-sm">{m.name}</span></div>
                  <span className="text-green-700 dark:text-green-400 font-semibold tabular-nums shrink-0 ml-2">{m.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3"><div className="h-2 w-2 rounded-full bg-red-500" /><h3 className="text-sm font-semibold">Top Outflow</h3></div>
            <div className="space-y-1">
              {topOutflow.map((m, i) => (
                <div key={m.name} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2 min-w-0"><span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}</span><span className="truncate text-xs sm:text-sm">{m.name}</span></div>
                  <span className="text-red-700 dark:text-red-400 font-semibold tabular-nums shrink-0 ml-2">{m.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Detail Drawer */}
      <RouteDetailDrawer
        open={selectedRoute !== null}
        onOpenChange={(open) => { if (!open) setSelectedRoute(null); }}
        route={selectedRoute}
        movements={movements}
        artworks={artworks}
        museumMap={museumMap}
        onArtworkSelect={(id) => {
          try {
            setSelectedRoute(null);
            onDrillDown(id);
          } catch {
            // Prevent crash
          }
        }}
      />
    </div>
  );
}
