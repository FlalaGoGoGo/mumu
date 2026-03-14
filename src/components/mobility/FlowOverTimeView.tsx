import { useMemo, useState, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarRange, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedPolyline } from './AnimatedPolyline';
import { TimePlaybackControl, useTimePlayback } from './TimePlaybackControl';
import { AnnualFlowChart } from './AnnualFlowChart';
import { YearlyMuseumRankings } from './YearlyMuseumRankings';
import { YearlyArtworkList } from './YearlyArtworkList';
import type { ArtworkMovement } from '@/types/movement';
import type { EnrichedArtwork } from '@/types/art';
import 'leaflet/dist/leaflet.css';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
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
  useMemo(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [points, map]);
  return null;
}

export function FlowOverTimeView({ movements, museumMap, artworks, onArtworkSelect }: Props) {
  const isMobile = useIsMobile();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

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

  // Filter movements by playback year
  const timeFilteredMovements = useMemo(() => {
    if (playback.isAtEnd && !playback.isPlaying) return movements;
    return movements.filter(m => {
      if (!m.start_date) return false;
      const y = parseInt(m.start_date.substring(0, 4));
      return !isNaN(y) && y <= playback.currentYear;
    });
  }, [movements, playback.currentYear, playback.isAtEnd, playback.isPlaying]);

  // Year-focused movements for analytics
  const yearFocusedMovements = useMemo(() => {
    if (!selectedYear) return timeFilteredMovements;
    return timeFilteredMovements.filter(m => {
      if (!m.start_date) return false;
      const y = parseInt(m.start_date.substring(0, 4));
      return y === selectedYear;
    });
  }, [timeFilteredMovements, selectedYear]);

  // Build corridors for the time-filtered map
  const { corridors, allPoints, involvedMuseums, maxEvents, museumEventCounts } = useMemo(() => {
    const src = selectedYear ? yearFocusedMovements : timeFilteredMovements;
    const corridorMap = new Map<string, {
      lender_museum_id: string; borrower_museum_id: string;
      count: number; maxYear: number;
    }>();
    const museumCounts = new Map<string, number>();

    for (const m of src) {
      const key = `${m.lender_museum_id}__${m.borrower_museum_id}`;
      if (!corridorMap.has(key)) {
        corridorMap.set(key, { lender_museum_id: m.lender_museum_id, borrower_museum_id: m.borrower_museum_id, count: 0, maxYear: 0 });
      }
      const c = corridorMap.get(key)!;
      c.count++;
      const y = parseInt(m.start_date?.substring(0, 4) || '');
      if (!isNaN(y) && y > c.maxYear) c.maxYear = y;
      museumCounts.set(m.lender_museum_id, (museumCounts.get(m.lender_museum_id) || 0) + 1);
      museumCounts.set(m.borrower_museum_id, (museumCounts.get(m.borrower_museum_id) || 0) + 1);
    }

    const corridors: { key: string; from: [number, number]; to: [number, number]; count: number; maxYear: number; lenderName: string; borrowerName: string }[] = [];
    const allPts: [number, number][] = [];
    const involved = new Map<string, MuseumPoint>();
    let maxEvents = 1;

    for (const [key, c] of corridorMap) {
      const from = museumMap.get(c.lender_museum_id);
      const to = museumMap.get(c.borrower_museum_id);
      if (!from || !to || (from.lat === 0 && from.lng === 0) || (to.lat === 0 && to.lng === 0)) continue;
      corridors.push({
        key, from: [from.lat, from.lng], to: [to.lat, to.lng],
        count: c.count, maxYear: c.maxYear, lenderName: from.name, borrowerName: to.name,
      });
      allPts.push([from.lat, from.lng], [to.lat, to.lng]);
      involved.set(from.museum_id, from);
      involved.set(to.museum_id, to);
      if (c.count > maxEvents) maxEvents = c.count;
    }
    return { corridors, allPoints: allPts, involvedMuseums: Array.from(involved.values()), maxEvents, museumEventCounts: museumCounts };
  }, [selectedYear, yearFocusedMovements, timeFilteredMovements, museumMap]);

  const center: [number, number] = allPoints.length > 0
    ? [allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length, allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length]
    : [48, 2];

  const handleYearSelect = useCallback((year: number | null) => {
    setSelectedYear(year);
    if (year !== null) playback.setCurrentYear(year);
  }, [playback]);

  // Summary
  const activeCount = activeYears.length;
  const totalEvents = timeFilteredMovements.length;
  const focusLabel = selectedYear ? `Focused: ${selectedYear}` : `${activeCount} active years`;

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
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{focusLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{totalEvents}</span> events through {playback.currentYear}
          </span>
        </div>
      </div>

      {/* Playback */}
      {yearBounds.min < yearBounds.max && (
        <TimePlaybackControl
          minYear={yearBounds.min}
          maxYear={yearBounds.max}
          currentYear={playback.currentYear}
          onYearChange={playback.setCurrentYear}
          isPlaying={playback.isPlaying}
          onPlayPause={playback.toggle}
          onReset={playback.reset}
          activeYears={activeYears}
          onPrev={playback.prev}
          onNext={playback.next}
          speed={playback.speed}
          onSpeedChange={playback.setSpeed}
          timeMode={playback.timeMode}
          onTimeModeChange={playback.setTimeMode}
        />
      )}

      {/* Time-filtered corridor map */}
      <div className="rounded-xl border border-border/60 overflow-hidden relative" style={{ height: isMobile ? 300 : 420 }}>
        <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {allPoints.length > 1 && <FitBounds points={allPoints} />}
          {corridors.map(c => {
            const intensity = c.count / maxEvents;
            const weight = 1.5 + intensity * 4;
            const opacity = 0.15 + intensity * 0.55;
            return (
              <AnimatedPolyline
                key={c.key}
                id={c.key}
                positions={createArc(c.from, c.to)}
                color="hsl(348, 45%, 42%)"
                weight={weight}
                opacity={opacity}
                highlighted={false}
                animated={playback.isPlaying && c.maxYear === playback.currentYear}
              />
            );
          })}
          {involvedMuseums.map(m => {
            const count = museumEventCounts.get(m.museum_id) || 0;
            const isTop = count > maxEvents * 0.5;
            return (
              <CircleMarker
                key={m.museum_id}
                center={[m.lat, m.lng]}
                radius={isTop ? 6 : 4}
                pathOptions={{
                  color: 'white', weight: 2,
                  fillColor: isTop ? 'hsl(348, 55%, 38%)' : 'hsl(348, 45%, 48%)',
                  fillOpacity: isTop ? 0.9 : 0.7,
                }}
              >
                <Popup><span className="text-xs font-semibold">{m.name}</span></Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        {selectedYear && (
          <div className="absolute top-3 left-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs border border-border/60 shadow-sm">
            Showing corridors through <span className="font-semibold">{selectedYear}</span>
          </div>
        )}
      </div>

      {/* Annual Flow Chart */}
      <AnnualFlowChart
        movements={timeFilteredMovements}
        selectedYear={selectedYear}
        onYearSelect={handleYearSelect}
        hoveredYear={hoveredYear}
        onYearHover={setHoveredYear}
      />

      {/* Yearly Museum Rankings */}
      <YearlyMuseumRankings
        movements={timeFilteredMovements}
        museumMap={museumMap}
        selectedYear={selectedYear}
      />

      {/* Yearly Artwork List */}
      <YearlyArtworkList
        movements={timeFilteredMovements}
        museumMap={museumMap}
        selectedYear={selectedYear}
        onArtworkSelect={onArtworkSelect}
      />
    </div>
  );
}
