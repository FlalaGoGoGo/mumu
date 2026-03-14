import { useMemo, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRightLeft, MapPin, Landmark, CalendarRange, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimatedPolyline } from './AnimatedPolyline';
import { TimePlaybackControl, useTimePlayback } from './TimePlaybackControl';
import type { ArtworkMovement } from '@/types/movement';
import type { EnrichedArtwork } from '@/types/art';
import 'leaflet/dist/leaflet.css';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

interface CorridorData {
  key: string;
  lender_museum_id: string;
  borrower_museum_id: string;
  lender_name: string;
  borrower_name: string;
  from: [number, number];
  to: [number, number];
  event_count: number;
  unique_artworks: string[];
  min_year: number;
  max_year: number;
  sample_titles: string[];
}

interface Props {
  movements: ArtworkMovement[];
  museumMap: Map<string, MuseumPoint>;
  artworks: EnrichedArtwork[];
  onDrillDown: (artworkId: string) => void;
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
  useMemo(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [points, map]);
  return null;
}

export function ArtistOverviewView({ movements, museumMap, artworks, onDrillDown }: Props) {
  const isMobile = useIsMobile();
  const [highlightedCorridor, setHighlightedCorridor] = useState<string | null>(null);

  // Determine year range from all movements
  const yearBounds = useMemo(() => {
    const years = movements
      .map(m => parseInt(m.start_date?.substring(0, 4) || ''))
      .filter(y => !isNaN(y) && y > 0);
    if (years.length === 0) return { min: 1880, max: 2025 };
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [movements]);

  const playback = useTimePlayback(yearBounds.min, yearBounds.max);

  // Filter movements by playback year
  const timeFilteredMovements = useMemo(() => {
    if (playback.isAtEnd && !playback.isPlaying) return movements; // full range
    return movements.filter(m => {
      if (!m.start_date) return false;
      const y = parseInt(m.start_date.substring(0, 4));
      return !isNaN(y) && y <= playback.currentYear;
    });
  }, [movements, playback.currentYear, playback.isAtEnd, playback.isPlaying]);

  const { corridors, allPoints, involvedMuseums, maxEvents, museumEventCounts } = useMemo(() => {
    const corridorMap = new Map<string, {
      lender_museum_id: string;
      borrower_museum_id: string;
      artworkIds: Set<string>;
      titles: Set<string>;
      years: number[];
      count: number;
    }>();

    const museumCounts = new Map<string, number>();

    for (const m of timeFilteredMovements) {
      const key = `${m.lender_museum_id}__${m.borrower_museum_id}`;
      if (!corridorMap.has(key)) {
        corridorMap.set(key, {
          lender_museum_id: m.lender_museum_id,
          borrower_museum_id: m.borrower_museum_id,
          artworkIds: new Set(),
          titles: new Set(),
          years: [],
          count: 0,
        });
      }
      const c = corridorMap.get(key)!;
      c.count++;
      c.artworkIds.add(m.artwork_id);
      if (m.artwork_title) c.titles.add(m.artwork_title);
      if (m.start_date) {
        const y = parseInt(m.start_date.substring(0, 4));
        if (!isNaN(y)) c.years.push(y);
      }

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
      if (!from || !to) continue;
      if (from.lat === 0 && from.lng === 0) continue;
      if (to.lat === 0 && to.lng === 0) continue;

      corridors.push({
        key,
        lender_museum_id: c.lender_museum_id,
        borrower_museum_id: c.borrower_museum_id,
        lender_name: from.name,
        borrower_name: to.name,
        from: [from.lat, from.lng],
        to: [to.lat, to.lng],
        event_count: c.count,
        unique_artworks: Array.from(c.artworkIds),
        min_year: c.years.length > 0 ? Math.min(...c.years) : 0,
        max_year: c.years.length > 0 ? Math.max(...c.years) : 0,
        sample_titles: Array.from(c.titles).slice(0, 5),
      });

      allPts.push([from.lat, from.lng], [to.lat, to.lng]);
      involved.set(from.museum_id, from);
      involved.set(to.museum_id, to);
      if (c.count > maxEvents) maxEvents = c.count;
    }

    return {
      corridors,
      allPoints: allPts,
      involvedMuseums: Array.from(involved.values()),
      maxEvents,
      museumEventCounts: museumCounts,
    };
  }, [timeFilteredMovements, museumMap]);

  // Summary stats
  const stats = useMemo(() => {
    const artworkIds = new Set(timeFilteredMovements.map(m => m.artwork_id));
    const museumIds = new Set<string>();
    timeFilteredMovements.forEach(m => { museumIds.add(m.lender_museum_id); museumIds.add(m.borrower_museum_id); });
    const years = timeFilteredMovements
      .map(m => parseInt(m.start_date?.substring(0, 4) || ''))
      .filter(y => !isNaN(y));
    return {
      totalEvents: timeFilteredMovements.length,
      artworksWithMovements: artworkIds.size,
      museumsInvolved: museumIds.size,
      minYear: years.length > 0 ? Math.min(...years) : 0,
      maxYear: years.length > 0 ? Math.max(...years) : 0,
    };
  }, [timeFilteredMovements]);

  // Top outflow / inflow museums
  const { outflowData, inflowData } = useMemo(() => {
    const outMap = new Map<string, { name: string; count: number; artworkIds: Set<string> }>();
    const inMap = new Map<string, { name: string; count: number; artworkIds: Set<string> }>();

    for (const m of timeFilteredMovements) {
      const lender = museumMap.get(m.lender_museum_id);
      const borrower = museumMap.get(m.borrower_museum_id);

      if (lender) {
        if (!outMap.has(m.lender_museum_id)) outMap.set(m.lender_museum_id, { name: lender.name, count: 0, artworkIds: new Set() });
        const o = outMap.get(m.lender_museum_id)!;
        o.count++;
        o.artworkIds.add(m.artwork_id);
      }
      if (borrower) {
        if (!inMap.has(m.borrower_museum_id)) inMap.set(m.borrower_museum_id, { name: borrower.name, count: 0, artworkIds: new Set() });
        const i = inMap.get(m.borrower_museum_id)!;
        i.count++;
        i.artworkIds.add(m.artwork_id);
      }
    }

    const outflowData = Array.from(outMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(d => ({ name: d.name.length > 28 ? d.name.substring(0, 26) + '…' : d.name, fullName: d.name, events: d.count, artworks: d.artworkIds.size }));

    const inflowData = Array.from(inMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(d => ({ name: d.name.length > 28 ? d.name.substring(0, 26) + '…' : d.name, fullName: d.name, events: d.count, artworks: d.artworkIds.size }));

    return { outflowData, inflowData };
  }, [timeFilteredMovements, museumMap]);

  const center: [number, number] = allPoints.length > 0
    ? [allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length, allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length]
    : [48, 2];

  const sortedCorridors = useMemo(
    () => [...corridors].sort((a, b) => b.event_count - a.event_count),
    [corridors]
  );

  const handleCorridorHover = useCallback((key: string | null) => {
    setHighlightedCorridor(key);
  }, []);

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
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.totalEvents}</p>
              <p className="text-xs text-muted-foreground">Movement Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.artworksWithMovements}</p>
              <p className="text-xs text-muted-foreground">Artworks Moved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Landmark className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.museumsInvolved}</p>
              <p className="text-xs text-muted-foreground">Museums Involved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarRange className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {stats.minYear > 0 ? `${stats.minYear}–${stats.maxYear}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Active Years</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Playback Control */}
      {yearBounds.min < yearBounds.max && (
        <TimePlaybackControl
          minYear={yearBounds.min}
          maxYear={yearBounds.max}
          currentYear={playback.currentYear}
          onYearChange={playback.setCurrentYear}
          isPlaying={playback.isPlaying}
          onPlayPause={playback.toggle}
          onReset={playback.reset}
        />
      )}

      {/* Map + Top Corridors side-by-side on desktop */}
      <div className={cn(
        isMobile ? 'space-y-4' : 'grid grid-cols-5 gap-5'
      )}>
        {/* Corridor Map */}
        <div className={cn(
          "rounded-xl border border-border/60 overflow-hidden relative",
          isMobile ? '' : 'col-span-3'
        )} style={{ height: isMobile ? 350 : 500 }}>
          <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {allPoints.length > 1 && <FitBounds points={allPoints} />}

            {corridors.map(c => {
              const intensity = c.event_count / maxEvents;
              const weight = 1.5 + intensity * 4.5;
              const baseOpacity = 0.15 + intensity * 0.55;
              const isHighlighted = highlightedCorridor === c.key;
              const isDimmed = highlightedCorridor !== null && !isHighlighted;

              return (
                <AnimatedPolyline
                  key={c.key}
                  id={c.key}
                  positions={createArc(c.from, c.to)}
                  color={isHighlighted ? 'hsl(348, 55%, 48%)' : 'hsl(348, 45%, 42%)'}
                  weight={weight}
                  opacity={isDimmed ? 0.08 : isHighlighted ? 0.95 : baseOpacity}
                  highlighted={isHighlighted}
                  animated={isHighlighted || (playback.isPlaying && c.max_year === playback.currentYear)}
                />
              );
            })}

            {involvedMuseums.map(m => {
              const count = museumEventCounts.get(m.museum_id) || 0;
              const isTopMuseum = count > (maxEvents * 0.5);
              return (
                <CircleMarker
                  key={m.museum_id}
                  center={[m.lat, m.lng]}
                  radius={isTopMuseum ? 7 : 5}
                  pathOptions={{
                    color: 'white',
                    weight: isTopMuseum ? 3 : 2,
                    fillColor: isTopMuseum ? 'hsl(348, 55%, 38%)' : 'hsl(348, 45%, 48%)',
                    fillOpacity: isTopMuseum ? 0.9 : 0.7,
                  }}
                >
                  <Popup><span className="text-xs font-semibold">{m.name}</span></Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1.5 border border-border/60 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-[3px] rounded-full" style={{ background: 'hsl(348,45%,42%)' }} />
              <span className="text-muted-foreground">Corridor (thickness = frequency)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: 'hsl(348,55%,38%)' }} />
              <span className="text-muted-foreground">Museum</span>
            </div>
          </div>
        </div>

        {/* Top Corridors Panel */}
        <Card className={cn(
          "border-border/60 overflow-hidden",
          isMobile ? '' : 'col-span-2'
        )}>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border/60">
              <h3 className="text-sm font-semibold">Top Corridors</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {corridors.length} corridors · {involvedMuseums.length} museums
              </p>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: isMobile ? 300 : 430 }}>
              {sortedCorridors.map((c, i) => {
                const isActive = highlightedCorridor === c.key;
                return (
                  <div
                    key={c.key}
                    className={cn(
                      "px-4 py-3 border-b border-border/30 cursor-pointer transition-colors",
                      isActive ? 'bg-primary/5' : 'hover:bg-muted/40'
                    )}
                    onMouseEnter={() => handleCorridorHover(c.key)}
                    onMouseLeave={() => handleCorridorHover(null)}
                    onClick={() => { if (c.unique_artworks[0]) onDrillDown(c.unique_artworks[0]); }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.lender_name}</p>
                        <p className="text-xs text-muted-foreground truncate">→ {c.borrower_name}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{c.event_count}</span> events
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{c.unique_artworks.length}</span> artworks
                      </span>
                      {c.min_year > 0 && (
                        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                          {c.min_year}–{c.max_year}
                        </span>
                      )}
                    </div>
                    {/* Intensity bar */}
                    <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(8, (c.event_count / maxEvents) * 100)}%`,
                          background: 'hsl(348, 45%, 42%)',
                          opacity: isActive ? 1 : 0.6,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Charts */}
      <div className={isMobile ? 'space-y-5' : 'grid grid-cols-2 gap-5'}>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4">Top Outflow Museums</h3>
            {outflowData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={outflowData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10 }} />
                  <RechartsTooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold">{d.fullName}</p>
                          <p>Events: {d.events}</p>
                          <p>Artworks: {d.artworks}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="events" radius={[0, 4, 4, 0]}>
                    {outflowData.map((_, i) => (
                      <Cell key={i} fill="hsl(348, 45%, 42%)" fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">No data</p>}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-4">Top Inflow Museums</h3>
            {inflowData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={inflowData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10 }} />
                  <RechartsTooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold">{d.fullName}</p>
                          <p>Events: {d.events}</p>
                          <p>Artworks: {d.artworks}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="events" radius={[0, 4, 4, 0]}>
                    {inflowData.map((_, i) => (
                      <Cell key={i} fill="hsl(160, 50%, 40%)" fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">No data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
