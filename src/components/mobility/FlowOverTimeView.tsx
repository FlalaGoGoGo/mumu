import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarRange, ArrowRightLeft, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedPolyline } from './AnimatedPolyline';
import { TimePlaybackControl, useTimePlayback } from './TimePlaybackControl';
import { AnnualFlowChart } from './AnnualFlowChart';
import { YearlyMuseumRankings } from './YearlyMuseumRankings';
import { getArtworkImageUrl } from '@/types/art';
import { getMuseumDisplayName } from '@/lib/humanizeMuseumId';
import type { ArtworkMovement } from '@/types/movement';
import type { EnrichedArtwork } from '@/types/art';
import 'leaflet/dist/leaflet.css';

/** MuMu gold from --accent token */
const GOLD = 'hsl(43, 60%, 45%)';
const GOLD_RING = 'hsl(43, 65%, 38%)';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

interface CorridorInfo {
  key: string;
  from: [number, number];
  to: [number, number];
  count: number;
  maxYear: number;
  lender_museum_id: string;
  borrower_museum_id: string;
}

interface Props {
  movements: ArtworkMovement[];
  museumMap: Map<string, MuseumPoint>;
  artworks: EnrichedArtwork[];
  onArtworkSelect: (artworkId: string) => void;
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

/** Focuses map on a specific corridor when hovered */
function MapFocusController({ corridor, allPoints }: { corridor: CorridorInfo | null; allPoints: [number, number][] }) {
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
      const dist = Math.sqrt(
        Math.pow(corridor.from[0] - corridor.to[0], 2) +
        Math.pow(corridor.from[1] - corridor.to[1], 2)
      );
      const maxZoom = dist < 0.5 ? 14 : dist < 2 ? 12 : dist < 5 ? 10 : 8;
      map.flyToBounds(bounds, { padding: [100, 100], maxZoom, duration: 0.6 });
    } else if (defaultBoundsRef.current) {
      map.flyToBounds(defaultBoundsRef.current, { padding: [40, 40], maxZoom: 8, duration: 0.6 });
    }
  }, [corridor, map]);

  return null;
}

/** Artwork tray showing works that moved in a specific year */
function YearArtworkTray({ movements, artworks, year, onArtworkSelect }: {
  movements: ArtworkMovement[]; artworks: EnrichedArtwork[]; year: number; onArtworkSelect: (id: string) => void;
}) {
  const artworkMap = useMemo(() => new Map(artworks.map(a => [a.artwork_id, a])), [artworks]);
  const yearArtworks = useMemo(() => {
    const ids = new Set<string>();
    for (const m of movements) {
      if (!m.start_date) continue;
      const y = parseInt(m.start_date.substring(0, 4));
      if (y === year) ids.add(m.artwork_id);
    }
    return Array.from(ids).map(id => artworkMap.get(id)).filter(Boolean) as EnrichedArtwork[];
  }, [movements, year, artworkMap]);

  if (yearArtworks.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5 text-accent" />
        <h4 className="text-xs font-semibold text-muted-foreground">
          Artworks in <span className="text-foreground font-bold">{year}</span>
          <span className="ml-1.5 text-muted-foreground font-normal">({yearArtworks.length})</span>
        </h4>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {yearArtworks.map(artwork => {
          const imageUrl = getArtworkImageUrl(artwork);
          return (
            <button key={artwork.artwork_id} onClick={() => {
              try { onArtworkSelect(artwork.artwork_id); } catch { /* prevent crash */ }
            }}
              className="group shrink-0 w-28 text-left rounded-lg border border-border/60 overflow-hidden hover:border-accent/60 hover:shadow-md transition-all">
              <div className="h-28 bg-muted overflow-hidden">
                {imageUrl ? (<img src={imageUrl} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (<div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/30" /></div>)}
              </div>
              <div className="p-1.5"><p className="text-[10px] font-medium line-clamp-2 leading-tight group-hover:text-accent transition-colors">{artwork.title}</p></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FlowOverTimeView({ movements, museumMap, artworks, onArtworkSelect }: Props) {
  const isMobile = useIsMobile();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [hoveredCorridor, setHoveredCorridor] = useState<string | null>(null);

  const activeYears = useMemo(() => {
    const years = new Set<number>();
    for (const m of movements) {
      if (!m.start_date) continue;
      const y = parseInt(m.start_date.substring(0, 4));
      if (!isNaN(y) && y > 0) years.add(y);
    }
    return Array.from(years).sort((a, b) => a - b);
  }, [movements]);

  const yearBounds = useMemo(() => {
    if (activeYears.length === 0) return { min: 1880, max: 2025 };
    return { min: activeYears[0], max: activeYears[activeYears.length - 1] };
  }, [activeYears]);

  const playback = useTimePlayback(yearBounds.min, yearBounds.max, activeYears);

  const timeFilteredMovements = useMemo(() => {
    if (playback.isAtEnd && !playback.isPlaying) return movements;
    return movements.filter(m => {
      if (!m.start_date) return false;
      const y = parseInt(m.start_date.substring(0, 4));
      return !isNaN(y) && y <= playback.currentYear;
    });
  }, [movements, playback.currentYear, playback.isAtEnd, playback.isPlaying]);

  const yearFocusedMovements = useMemo(() => {
    if (!selectedYear) return timeFilteredMovements;
    return timeFilteredMovements.filter(m => {
      if (!m.start_date) return false;
      return parseInt(m.start_date.substring(0, 4)) === selectedYear;
    });
  }, [timeFilteredMovements, selectedYear]);

  // Current-year movements for highlighting
  const currentYearMovementKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const m of movements) {
      if (!m.start_date) continue;
      const y = parseInt(m.start_date.substring(0, 4));
      if (y === playback.currentYear) {
        keys.add(`${m.lender_museum_id}__${m.borrower_museum_id}`);
      }
    }
    return keys;
  }, [movements, playback.currentYear]);

  // Current-year museum endpoints for highlighting
  const currentYearMuseums = useMemo(() => {
    const ids = new Set<string>();
    for (const m of movements) {
      if (!m.start_date) continue;
      const y = parseInt(m.start_date.substring(0, 4));
      if (y === playback.currentYear) {
        ids.add(m.lender_museum_id);
        ids.add(m.borrower_museum_id);
      }
    }
    return ids;
  }, [movements, playback.currentYear]);

  const { corridors, allPoints, involvedMuseums, maxEvents } = useMemo(() => {
    const src = selectedYear ? yearFocusedMovements : timeFilteredMovements;
    const corridorMap = new Map<string, { lender_museum_id: string; borrower_museum_id: string; count: number; maxYear: number }>();

    for (const m of src) {
      const key = `${m.lender_museum_id}__${m.borrower_museum_id}`;
      if (!corridorMap.has(key)) corridorMap.set(key, { lender_museum_id: m.lender_museum_id, borrower_museum_id: m.borrower_museum_id, count: 0, maxYear: 0 });
      const c = corridorMap.get(key)!;
      c.count++;
      const y = parseInt(m.start_date?.substring(0, 4) || '');
      if (!isNaN(y) && y > c.maxYear) c.maxYear = y;
    }

    const corridors: CorridorInfo[] = [];
    const allPts: [number, number][] = [];
    const involved = new Map<string, MuseumPoint>();
    let maxEvents = 1;

    for (const [key, c] of corridorMap) {
      const from = museumMap.get(c.lender_museum_id);
      const to = museumMap.get(c.borrower_museum_id);
      if (!from || !to || (from.lat === 0 && from.lng === 0) || (to.lat === 0 && to.lng === 0)) continue;
      corridors.push({ key, from: [from.lat, from.lng], to: [to.lat, to.lng], count: c.count, maxYear: c.maxYear, lender_museum_id: c.lender_museum_id, borrower_museum_id: c.borrower_museum_id });
      allPts.push([from.lat, from.lng], [to.lat, to.lng]);
      involved.set(from.museum_id, from);
      involved.set(to.museum_id, to);
      if (c.count > maxEvents) maxEvents = c.count;
    }
    return { corridors, allPoints: allPts, involvedMuseums: Array.from(involved.values()), maxEvents };
  }, [selectedYear, yearFocusedMovements, timeFilteredMovements, museumMap]);

  const center: [number, number] = allPoints.length > 0
    ? [allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length, allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length]
    : [48, 2];

  const handleYearSelect = useCallback((year: number | null) => {
    setSelectedYear(year);
    if (year !== null) playback.setCurrentYear(year);
  }, [playback]);

  const safeArtworkSelect = useCallback((id: string) => {
    try { onArtworkSelect(id); } catch { /* prevent crash */ }
  }, [onArtworkSelect]);

  const artworkTrayYear = selectedYear || (playback.isPlaying ? playback.currentYear : null);
  const isAnimating = playback.isPlaying || (!playback.isAtEnd);

  // Determine hovered corridor info for map focus
  const hoveredCorridorInfo = useMemo(() => {
    if (!hoveredCorridor) return null;
    return corridors.find(c => c.key === hoveredCorridor) || null;
  }, [hoveredCorridor, corridors]);

  const hoveredEndpoints = useMemo(() => {
    if (!hoveredCorridor) return new Set<string>();
    const c = corridors.find(c => c.key === hoveredCorridor);
    if (!c) return new Set<string>();
    return new Set([c.lender_museum_id, c.borrower_museum_id]);
  }, [hoveredCorridor, corridors]);

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <CalendarRange className="h-8 w-8 mb-2" />
        <p className="font-medium">No movement data available for time analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4 text-primary" /><span className="text-muted-foreground">{selectedYear ? `Focused: ${selectedYear}` : `${activeYears.length} active years`}</span></div>
        <div className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4 text-primary" /><span className="text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{timeFilteredMovements.length}</span> events through {playback.currentYear}</span></div>
      </div>

      {yearBounds.min < yearBounds.max && (
        <TimePlaybackControl
          minYear={yearBounds.min} maxYear={yearBounds.max} currentYear={playback.currentYear}
          onYearChange={playback.setCurrentYear} isPlaying={playback.isPlaying}
          onPlayPause={playback.toggle} onReset={playback.reset} activeYears={activeYears}
          onPrev={playback.prev} onNext={playback.next} speed={playback.speed}
          onSpeedChange={playback.setSpeed} timeMode={playback.timeMode} onTimeModeChange={playback.setTimeMode}
        />
      )}

      {artworkTrayYear && (
        <YearArtworkTray movements={movements} artworks={artworks} year={artworkTrayYear} onArtworkSelect={safeArtworkSelect} />
      )}

      {/* Time-filtered corridor map */}
      <div className="rounded-xl border border-border/60 overflow-hidden relative" style={{ height: isMobile ? 320 : 460 }}>
        <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
          {allPoints.length > 1 && <FitBounds points={allPoints} />}
          <MapFocusController corridor={hoveredCorridorInfo} allPoints={allPoints} />

          {/* Route lines first (beneath markers) */}
          {corridors.map(c => {
            const intensity = c.count / maxEvents;
            const isCurrentYear = isAnimating && currentYearMovementKeys.has(c.key);
            const isHovered = hoveredCorridor === c.key;
            const isActive = isCurrentYear || isHovered;
            const isDimmed = (isAnimating && !isCurrentYear && !isHovered) || (hoveredCorridor !== null && !isHovered);
            return (
              <AnimatedPolyline key={c.key} id={c.key}
                positions={createArc(c.from, c.to)}
                color={isActive ? GOLD : 'hsl(348, 45%, 42%)'}
                weight={isActive ? 3 : 1 + intensity * 2.5}
                opacity={isActive ? 0.9 : isDimmed ? 0.04 : 0.1 + intensity * 0.35}
                highlighted={isActive}
                animated={isActive}
              />
            );
          })}

          {/* Museum markers on top */}
          {involvedMuseums.map(m => {
            const isActiveMuseum = (isAnimating && currentYearMuseums.has(m.museum_id)) || hoveredEndpoints.has(m.museum_id);
            const isDimmed = (isAnimating && !currentYearMuseums.has(m.museum_id) && !hoveredEndpoints.has(m.museum_id)) ||
              (hoveredCorridor !== null && !hoveredEndpoints.has(m.museum_id));
            return (
              <CircleMarker key={m.museum_id} center={[m.lat, m.lng]}
                radius={isActiveMuseum ? 9 : 5}
                pathOptions={{
                  color: isActiveMuseum ? GOLD_RING : 'hsl(348, 55%, 38%)',
                  weight: isActiveMuseum ? 3 : 2,
                  fillColor: 'white',
                  fillOpacity: isDimmed ? 0.1 : 1,
                  opacity: isDimmed ? 0.1 : 1,
                }}>
                <Popup><span className="text-xs font-semibold">{getMuseumDisplayName(m.museum_id, museumMap)}</span></Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Year indicator - top-right to avoid zoom controls */}
        {isAnimating && (
          <div className="absolute top-3 right-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs border border-border/60 shadow-sm">
            <span className="font-bold text-accent tabular-nums text-sm">{playback.currentYear}</span>
            <span className="text-muted-foreground ml-1.5">active</span>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg p-2.5 text-[10px] space-y-1 border border-border/60 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-[3px] rounded-full" style={{ background: GOLD }} />
            <span className="text-muted-foreground">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-[2px] rounded-full" style={{ background: 'hsl(348,45%,42%)' }} />
            <span className="text-muted-foreground">Background</span>
          </div>
        </div>
      </div>

      <AnnualFlowChart movements={timeFilteredMovements} selectedYear={selectedYear} onYearSelect={handleYearSelect} hoveredYear={null} onYearHover={() => {}} />
      <YearlyMuseumRankings movements={timeFilteredMovements} museumMap={museumMap} selectedYear={selectedYear} />
    </div>
  );
}
