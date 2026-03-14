import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRightLeft, MapPin, Landmark, CalendarRange } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

  const { corridors, allPoints, involvedMuseums, maxEvents } = useMemo(() => {
    const corridorMap = new Map<string, {
      lender_museum_id: string;
      borrower_museum_id: string;
      artworkIds: Set<string>;
      titles: Set<string>;
      years: number[];
      count: number;
    }>();

    for (const m of movements) {
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
    };
  }, [movements, museumMap]);

  // Summary stats
  const stats = useMemo(() => {
    const artworkIds = new Set(movements.map(m => m.artwork_id));
    const museumIds = new Set<string>();
    movements.forEach(m => { museumIds.add(m.lender_museum_id); museumIds.add(m.borrower_museum_id); });
    const years = movements
      .map(m => parseInt(m.start_date?.substring(0, 4) || ''))
      .filter(y => !isNaN(y));

    return {
      totalEvents: movements.length,
      artworksWithMovements: artworkIds.size,
      museumsInvolved: museumIds.size,
      minYear: years.length > 0 ? Math.min(...years) : 0,
      maxYear: years.length > 0 ? Math.max(...years) : 0,
    };
  }, [movements]);

  // Top outflow / inflow museums
  const { outflowData, inflowData } = useMemo(() => {
    const outMap = new Map<string, { name: string; count: number; artworkIds: Set<string> }>();
    const inMap = new Map<string, { name: string; count: number; artworkIds: Set<string> }>();

    for (const m of movements) {
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
      .map(d => ({ name: d.name.length > 25 ? d.name.substring(0, 23) + '…' : d.name, fullName: d.name, events: d.count, artworks: d.artworkIds.size }));

    const inflowData = Array.from(inMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(d => ({ name: d.name.length > 25 ? d.name.substring(0, 23) + '…' : d.name, fullName: d.name, events: d.count, artworks: d.artworkIds.size }));

    return { outflowData, inflowData };
  }, [movements, museumMap]);

  const center: [number, number] = allPoints.length > 0
    ? [allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length, allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length]
    : [48, 2];

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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowRightLeft className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats.totalEvents}</p>
              <p className="text-xs text-muted-foreground">Movement Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats.artworksWithMovements}</p>
              <p className="text-xs text-muted-foreground">Artworks Moved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Landmark className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats.museumsInvolved}</p>
              <p className="text-xs text-muted-foreground">Museums Involved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarRange className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-bold">{stats.minYear}–{stats.maxYear}</p>
              <p className="text-xs text-muted-foreground">Active Years</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Corridor Map */}
      <div className="rounded-lg border overflow-hidden relative" style={{ height: isMobile ? 350 : 480 }}>
        <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {allPoints.length > 1 && <FitBounds points={allPoints} />}

          {corridors.map(c => {
            const weight = 1.5 + (c.event_count / maxEvents) * 5;
            return (
              <Polyline
                key={c.key}
                positions={createArc(c.from, c.to)}
                pathOptions={{
                  color: 'hsl(348, 45%, 42%)',
                  weight,
                  opacity: 0.6,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1.5 min-w-[200px]">
                    <p className="font-semibold">{c.lender_name} → {c.borrower_name}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <span className="text-muted-foreground">Events:</span>
                      <span className="font-medium">{c.event_count}</span>
                      <span className="text-muted-foreground">Artworks:</span>
                      <span className="font-medium">{c.unique_artworks.length}</span>
                      {c.min_year > 0 && (
                        <>
                          <span className="text-muted-foreground">Years:</span>
                          <span className="font-medium">{c.min_year}–{c.max_year}</span>
                        </>
                      )}
                    </div>
                    {c.sample_titles.length > 0 && (
                      <div className="pt-1 border-t">
                        <p className="font-medium mb-0.5">Artworks:</p>
                        {c.sample_titles.map((t, i) => (
                          <p key={i} className="truncate cursor-pointer hover:text-primary"
                            onClick={() => {
                              if (c.unique_artworks[i]) onDrillDown(c.unique_artworks[i]);
                            }}
                          >{t}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {involvedMuseums.map(m => (
            <CircleMarker
              key={m.museum_id}
              center={[m.lat, m.lng]}
              radius={5}
              pathOptions={{ color: 'white', weight: 2, fillColor: 'hsl(348, 45%, 32%)', fillOpacity: 0.8 }}
            >
              <Popup><span className="text-xs font-semibold">{m.name}</span></Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 z-[1000] bg-background/90 backdrop-blur rounded-md p-2 text-xs space-y-1 border shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 border-t-2" style={{ borderColor: 'hsl(348,45%,42%)' }} />
            <span>Corridor (thickness = frequency)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(348,45%,32%)' }} />
            <span>Museum</span>
          </div>
        </div>
      </div>

      {/* Bar Charts */}
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4'}>
        {/* Top Outflow */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Top Outflow Museums</h3>
            {outflowData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={outflowData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                  <RechartsTooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-md px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold">{d.fullName}</p>
                          <p>Events: {d.events}</p>
                          <p>Artworks: {d.artworks}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="events" radius={[0, 4, 4, 0]}>
                    {outflowData.map((_, i) => (
                      <Cell key={i} fill="hsl(348, 45%, 42%)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">No data</p>}
          </CardContent>
        </Card>

        {/* Top Inflow */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Top Inflow Museums</h3>
            {inflowData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={inflowData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                  <RechartsTooltip
                    content={({ payload }) => {
                      if (!payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-md px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold">{d.fullName}</p>
                          <p>Events: {d.events}</p>
                          <p>Artworks: {d.artworks}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="events" radius={[0, 4, 4, 0]}>
                    {inflowData.map((_, i) => (
                      <Cell key={i} fill="hsl(160, 50%, 40%)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Corridor Summary Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold">Movement Corridors</h3>
            <p className="text-xs text-muted-foreground">{corridors.length} corridors across {involvedMuseums.length} museums</p>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b">
                <tr>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Lender</th>
                  <th className="text-left p-2 text-xs font-medium text-muted-foreground">Borrower</th>
                  <th className="text-right p-2 text-xs font-medium text-muted-foreground">Events</th>
                  <th className="text-right p-2 text-xs font-medium text-muted-foreground">Artworks</th>
                  <th className="text-right p-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Years</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {corridors
                  .sort((a, b) => b.event_count - a.event_count)
                  .map(c => (
                    <tr
                      key={c.key}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => { if (c.unique_artworks[0]) onDrillDown(c.unique_artworks[0]); }}
                    >
                      <td className="p-2 truncate max-w-[160px]">{c.lender_name}</td>
                      <td className="p-2 truncate max-w-[160px]">{c.borrower_name}</td>
                      <td className="p-2 text-right font-medium">{c.event_count}</td>
                      <td className="p-2 text-right">{c.unique_artworks.length}</td>
                      <td className="p-2 text-right text-muted-foreground hidden sm:table-cell">
                        {c.min_year > 0 ? `${c.min_year}–${c.max_year}` : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
