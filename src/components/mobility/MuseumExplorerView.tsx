import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Landmark, X, Globe, Building, Map as MapIcon } from 'lucide-react';
import { AnimatedPolyline } from './AnimatedPolyline';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { getMuseumDisplayName } from '@/lib/humanizeMuseumId';
import { getCountryFlag } from '@/lib/countryFlag';
import { getArtworkImageUrl } from '@/types/art';
import type { ArtworkMovement, MuseumFlowStats } from '@/types/movement';
import type { EnrichedArtwork } from '@/types/art';
import type { Museum } from '@/types/museum';
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
  museums: Museum[];
  onArtworkSelect: (artworkId: string) => void;
}

type CountMode = 'events' | 'artworks';
type GeoGranularity = 'museum' | 'country' | 'city';

/**
 * Get proper city and country for a museum by looking up the full museums dataset.
 * This avoids parsing addresses which leads to garbage data.
 */
function getMuseumGeoFromDataset(
  museumId: string,
  museumsByIdMap: Map<string, Museum>,
): { country: string; city: string } {
  const museum = museumsByIdMap.get(museumId);
  if (museum) {
    return {
      country: museum.country || 'Unknown',
      city: museum.city || 'Unknown',
    };
  }
  return { country: 'Unknown', city: 'Unknown' };
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
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }
  }, [points, map]);
  return null;
}

export function MuseumExplorerView({ movements, museumMap, artworks, museums, onArtworkSelect }: Props) {
  const isMobile = useIsMobile();
  const [countMode, setCountMode] = useState<CountMode>('events');
  const [geoGranularity, setGeoGranularity] = useState<GeoGranularity>('museum');
  const [selectedMuseum, setSelectedMuseum] = useState<string | null>(null);

  // Build a proper museum-by-id map from the full museum dataset
  const museumsByIdMap = useMemo(() => {
    const m = new Map<string, Museum>();
    for (const museum of museums) {
      m.set(museum.museum_id, museum);
    }
    return m;
  }, [museums]);

  // Per-museum flow stats
  const flowStats = useMemo(() => {
    const stats = new Map<string, { inflow: number; outflow: number; artworkIdsIn: Set<string>; artworkIdsOut: Set<string> }>();
    for (const m of movements) {
      if (!stats.has(m.lender_museum_id)) stats.set(m.lender_museum_id, { inflow: 0, outflow: 0, artworkIdsIn: new Set(), artworkIdsOut: new Set() });
      const lender = stats.get(m.lender_museum_id)!;
      lender.outflow++;
      lender.artworkIdsOut.add(m.artwork_id);

      if (!stats.has(m.borrower_museum_id)) stats.set(m.borrower_museum_id, { inflow: 0, outflow: 0, artworkIdsIn: new Set(), artworkIdsOut: new Set() });
      const borrower = stats.get(m.borrower_museum_id)!;
      borrower.inflow++;
      borrower.artworkIdsIn.add(m.artwork_id);
    }

    const result: (MuseumFlowStats & { unique_in: number; unique_out: number })[] = [];
    const artworkMap = new Map(artworks.map(a => [a.artwork_id, a]));
    for (const [museumId, s] of stats) {
      const museum = museumMap.get(museumId);
      if (!museum || (museum.lat === 0 && museum.lng === 0)) continue;
      result.push({
        museum_id: museumId,
        museum_name: getMuseumDisplayName(museumId, museumMap),
        lat: museum.lat, lng: museum.lng,
        inflow_count: s.inflow, outflow_count: s.outflow, net_flow: s.inflow - s.outflow,
        unique_in: s.artworkIdsIn.size, unique_out: s.artworkIdsOut.size,
        top_artworks: Array.from(new Set([...s.artworkIdsIn, ...s.artworkIdsOut])).slice(0, 8).map(id => ({
          artwork_id: id, title: artworkMap.get(id)?.title || id,
        })),
      });
    }
    return result;
  }, [movements, museumMap, artworks]);

  // Geography aggregation - uses real museum city/country data
  const geoStats = useMemo(() => {
    if (geoGranularity === 'museum') return null;

    // Aggregate flow per movement at the geography level
    const geoFlow = new Map<string, { inflow: number; outflow: number; lat: number; lng: number; latSum: number; lngSum: number; count: number }>();

    for (const m of movements) {
      const lenderGeo = getMuseumGeoFromDataset(m.lender_museum_id, museumsByIdMap);
      const borrowerGeo = getMuseumGeoFromDataset(m.borrower_museum_id, museumsByIdMap);

      const lenderKey = geoGranularity === 'country' ? lenderGeo.country : lenderGeo.city;
      const borrowerKey = geoGranularity === 'country' ? borrowerGeo.country : borrowerGeo.city;

      // Lender outflow
      if (!geoFlow.has(lenderKey)) {
        const lm = museumMap.get(m.lender_museum_id);
        geoFlow.set(lenderKey, { inflow: 0, outflow: 0, lat: lm?.lat || 0, lng: lm?.lng || 0, latSum: lm?.lat || 0, lngSum: lm?.lng || 0, count: 1 });
      }
      const lg = geoFlow.get(lenderKey)!;
      lg.outflow++;

      // Borrower inflow
      if (!geoFlow.has(borrowerKey)) {
        const bm = museumMap.get(m.borrower_museum_id);
        geoFlow.set(borrowerKey, { inflow: 0, outflow: 0, lat: bm?.lat || 0, lng: bm?.lng || 0, latSum: bm?.lat || 0, lngSum: bm?.lng || 0, count: 1 });
      }
      const bg = geoFlow.get(borrowerKey)!;
      bg.inflow++;
    }

    // Compute average lat/lng for each geo key from all museums in that geo
    const geoPositions = new Map<string, { latSum: number; lngSum: number; count: number }>();
    for (const museum of museums) {
      const key = geoGranularity === 'country' ? museum.country : museum.city;
      if (!key) continue;
      if (!geoPositions.has(key)) geoPositions.set(key, { latSum: 0, lngSum: 0, count: 0 });
      const p = geoPositions.get(key)!;
      p.latSum += museum.lat;
      p.lngSum += museum.lng;
      p.count++;
    }

    return Array.from(geoFlow.entries())
      .filter(([name]) => name && name !== 'Unknown')
      .map(([name, g]) => {
        const pos = geoPositions.get(name);
        return {
          name,
          displayName: geoGranularity === 'country' ? `${getCountryFlag(name)} ${name}` : name,
          sortName: name,
          inflow: g.inflow,
          outflow: g.outflow,
          net: g.inflow - g.outflow,
          lat: pos ? pos.latSum / pos.count : g.lat,
          lng: pos ? pos.lngSum / pos.count : g.lng,
        };
      })
      .sort((a, b) => a.sortName.localeCompare(b.sortName));
  }, [flowStats, geoGranularity, movements, museumsByIdMap, museums, museumMap]);

  const getFlowValue = (s: typeof flowStats[0], direction: 'in' | 'out' | 'net') => {
    if (countMode === 'artworks') {
      if (direction === 'in') return s.unique_in;
      if (direction === 'out') return s.unique_out;
      return s.unique_in - s.unique_out;
    }
    if (direction === 'in') return s.inflow_count;
    if (direction === 'out') return s.outflow_count;
    return s.net_flow;
  };

  // Map data depends on granularity
  const mapData = useMemo(() => {
    if (geoGranularity === 'museum' || !geoStats) {
      return {
        points: flowStats.map(s => ({ id: s.museum_id, name: s.museum_name, lat: s.lat, lng: s.lng, inflow: s.inflow_count, outflow: s.outflow_count, net: s.net_flow })),
      };
    }
    return {
      points: geoStats.map(s => ({ id: s.name, name: s.displayName, lat: s.lat, lng: s.lng, inflow: s.inflow, outflow: s.outflow, net: s.net })),
    };
  }, [geoGranularity, geoStats, flowStats]);

  const allPoints: [number, number][] = mapData.points.map(p => [p.lat, p.lng]);
  const maxMagnitude = Math.max(1, ...mapData.points.map(p => Math.abs(p.net)));

  // Top inflow / outflow adapts to granularity
  const { topInflow, topOutflow } = useMemo(() => {
    if (geoGranularity === 'museum' || !geoStats) {
      const sorted = [...flowStats].sort((a, b) => getFlowValue(b, 'in') - getFlowValue(a, 'in'));
      return {
        topInflow: sorted.slice(0, 8),
        topOutflow: [...flowStats].sort((a, b) => getFlowValue(b, 'out') - getFlowValue(a, 'out')).slice(0, 8),
      };
    }
    const sortedIn = [...geoStats].sort((a, b) => b.inflow - a.inflow).slice(0, 8);
    const sortedOut = [...geoStats].sort((a, b) => b.outflow - a.outflow).slice(0, 8);
    return { topInflow: sortedIn, topOutflow: sortedOut };
  }, [flowStats, geoStats, geoGranularity, countMode]);

  // Selected museum detail
  const selectedMuseumData = useMemo(() => {
    if (!selectedMuseum) return null;
    return flowStats.find(s => s.museum_id === selectedMuseum) || null;
  }, [flowStats, selectedMuseum]);

  const counterparts = useMemo(() => {
    if (!selectedMuseum) return [];
    const map = new Map<string, { inflow: number; outflow: number }>();
    for (const m of movements) {
      if (m.lender_museum_id === selectedMuseum) {
        if (!map.has(m.borrower_museum_id)) map.set(m.borrower_museum_id, { inflow: 0, outflow: 0 });
        map.get(m.borrower_museum_id)!.outflow++;
      }
      if (m.borrower_museum_id === selectedMuseum) {
        if (!map.has(m.lender_museum_id)) map.set(m.lender_museum_id, { inflow: 0, outflow: 0 });
        map.get(m.lender_museum_id)!.inflow++;
      }
    }
    return Array.from(map.entries())
      .map(([id, d]) => ({ museum_id: id, name: getMuseumDisplayName(id, museumMap), ...d, total: d.inflow + d.outflow }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [movements, selectedMuseum, museumMap]);

  const relatedArtworks = useMemo(() => {
    if (!selectedMuseum) return [];
    const ids = new Set<string>();
    for (const m of movements) {
      if (m.lender_museum_id === selectedMuseum || m.borrower_museum_id === selectedMuseum) ids.add(m.artwork_id);
    }
    return Array.from(ids).slice(0, 12).map(id => artworks.find(art => art.artwork_id === id) || null).filter(Boolean) as EnrichedArtwork[];
  }, [movements, selectedMuseum, artworks]);

  const museumTrend = useMemo(() => {
    if (!selectedMuseum) return [];
    const yearMap = new Map<number, { inflow: number; outflow: number }>();
    for (const m of movements) {
      if (m.lender_museum_id !== selectedMuseum && m.borrower_museum_id !== selectedMuseum) continue;
      if (!m.start_date) continue;
      const y = parseInt(m.start_date.substring(0, 4));
      if (isNaN(y)) continue;
      if (!yearMap.has(y)) yearMap.set(y, { inflow: 0, outflow: 0 });
      const row = yearMap.get(y)!;
      if (m.borrower_museum_id === selectedMuseum) row.inflow++;
      if (m.lender_museum_id === selectedMuseum) row.outflow++;
    }
    return Array.from(yearMap.entries()).map(([year, d]) => ({ year, ...d })).sort((a, b) => a.year - b.year);
  }, [movements, selectedMuseum]);

  const selectedArcs = useMemo(() => {
    if (!selectedMuseum) return [];
    const corridorMap = new Map<string, { from: MuseumPoint; to: MuseumPoint; count: number }>();
    for (const m of movements) {
      if (m.lender_museum_id !== selectedMuseum && m.borrower_museum_id !== selectedMuseum) continue;
      const key = `${m.lender_museum_id}__${m.borrower_museum_id}`;
      if (!corridorMap.has(key)) {
        const from = museumMap.get(m.lender_museum_id);
        const to = museumMap.get(m.borrower_museum_id);
        if (!from || !to || (from.lat === 0 && from.lng === 0) || (to.lat === 0 && to.lng === 0)) continue;
        corridorMap.set(key, { from, to, count: 0 });
      }
      corridorMap.get(key)!.count++;
    }
    const maxC = Math.max(1, ...Array.from(corridorMap.values()).map(c => c.count));
    return Array.from(corridorMap.entries()).map(([key, c]) => ({
      key, from: [c.from.lat, c.from.lng] as [number, number],
      to: [c.to.lat, c.to.lng] as [number, number],
      count: c.count, intensity: c.count / maxC,
    }));
  }, [movements, selectedMuseum, museumMap]);

  const handleMuseumToggle = (id: string) => setSelectedMuseum(prev => prev === id ? null : id);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Count by:</span>
          <div className="flex gap-0.5 rounded-lg border border-border/60 p-0.5">
            <Button variant={countMode === 'events' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-3" onClick={() => setCountMode('events')}>Events</Button>
            <Button variant={countMode === 'artworks' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-3" onClick={() => setCountMode('artworks')}>Artworks</Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Granularity:</span>
          <div className="flex gap-0.5 rounded-lg border border-border/60 p-0.5">
            <Button variant={geoGranularity === 'museum' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-3 gap-1.5" onClick={() => { setGeoGranularity('museum'); setSelectedMuseum(null); }}>
              <Building className="h-3 w-3" />Museum
            </Button>
            <Button variant={geoGranularity === 'city' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-3 gap-1.5" onClick={() => { setGeoGranularity('city'); setSelectedMuseum(null); }}>
              <MapIcon className="h-3 w-3" />City
            </Button>
            <Button variant={geoGranularity === 'country' ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-3 gap-1.5" onClick={() => { setGeoGranularity('country'); setSelectedMuseum(null); }}>
              <Globe className="h-3 w-3" />Country
            </Button>
          </div>
        </div>
      </div>

      {/* Geography aggregation table */}
      {geoStats && (
        <Card className="border-border/60 overflow-hidden">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border/60">
              <h3 className="text-sm font-semibold">
                {geoGranularity === 'country' ? 'Country' : 'City'} Flow Summary
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{geoStats.length} {geoGranularity === 'country' ? 'countries' : 'cities'}</p>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">{geoGranularity === 'country' ? 'Country' : 'City'}</th>
                    <th className="text-right p-3 text-xs font-medium text-green-700 dark:text-green-400">In</th>
                    <th className="text-right p-3 text-xs font-medium text-red-700 dark:text-red-400">Out</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {[...geoStats].sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).map(s => (
                    <tr key={s.name} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-medium">{s.displayName}</td>
                      <td className="p-3 text-right text-green-700 dark:text-green-400 tabular-nums">{s.inflow}</td>
                      <td className="p-3 text-right text-red-700 dark:text-red-400 tabular-nums">{s.outflow}</td>
                      <td className={cn("p-3 text-right font-semibold tabular-nums",
                        s.net > 0 ? 'text-green-700 dark:text-green-400' : s.net < 0 ? 'text-red-700 dark:text-red-400' : '')}>
                        {s.net > 0 ? '+' : ''}{s.net}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <div className="rounded-xl border border-border/60 overflow-hidden relative" style={{ height: isMobile ? 350 : 480 }}>
        <MapContainer center={[48, 2]} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          />
          {allPoints.length > 1 && <FitBounds points={allPoints} />}

          {selectedArcs.map(arc => (
            <AnimatedPolyline
              key={arc.key} id={arc.key}
              positions={createArc(arc.from, arc.to)}
              color="hsl(348, 45%, 42%)"
              weight={1.5 + arc.intensity * 4}
              opacity={0.3 + arc.intensity * 0.5}
              highlighted={false} animated={false}
            />
          ))}

          {mapData.points.map(p => {
            const magnitude = Math.abs(p.net);
            const radius = 6 + (magnitude / maxMagnitude) * 16;
            const color = p.net > 0 ? 'hsl(160, 50%, 40%)' : p.net < 0 ? 'hsl(348, 45%, 42%)' : 'hsl(43, 60%, 45%)';
            const isSelected = geoGranularity === 'museum' && selectedMuseum === p.id;
            const isDimmed = geoGranularity === 'museum' && selectedMuseum !== null && !isSelected && !counterparts.some(c => c.museum_id === p.id);

            return (
              <CircleMarker
                key={p.id} center={[p.lat, p.lng]}
                radius={isSelected ? radius + 3 : radius}
                pathOptions={{
                  color: isSelected ? 'hsl(348, 55%, 32%)' : 'white',
                  weight: isSelected ? 3 : 2,
                  fillColor: color, fillOpacity: isDimmed ? 0.15 : 0.75,
                }}
                eventHandlers={geoGranularity === 'museum' ? { click: () => handleMuseumToggle(p.id) } : {}}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[180px]">
                    <p className="font-semibold">{p.name}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <span className="text-muted-foreground">Inflow:</span>
                      <span className="font-medium text-green-700">{p.inflow}</span>
                      <span className="text-muted-foreground">Outflow:</span>
                      <span className="font-medium text-red-700">{p.outflow}</span>
                      <span className="text-muted-foreground">Net:</span>
                      <span className={cn("font-bold", p.net > 0 ? 'text-green-700' : p.net < 0 ? 'text-red-700' : '')}>
                        {p.net > 0 ? '+' : ''}{p.net}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-3 left-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1.5 border border-border/60 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(160,50%,40%)' }} />
            <span className="text-muted-foreground">Net importer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(348,45%,42%)' }} />
            <span className="text-muted-foreground">Net exporter</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(43,60%,45%)' }} />
            <span className="text-muted-foreground">Balanced</span>
          </div>
        </div>
      </div>

      {/* Selected Museum Detail Panel */}
      {selectedMuseumData && geoGranularity === 'museum' && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{selectedMuseumData.museum_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {getFlowValue(selectedMuseumData, 'in')} in · {getFlowValue(selectedMuseumData, 'out')} out · Net {(() => { const n = getFlowValue(selectedMuseumData, 'net'); return n > 0 ? `+${n}` : `${n}`; })()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedMuseum(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {museumTrend.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inflow vs Outflow Over Time</h4>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={museumTrend} margin={{ left: 0, right: 5 }}>
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} width={25} />
                    <RechartsTooltip
                      content={({ payload, label }) => {
                        if (!payload?.length) return null;
                        return (
                          <div className="bg-background border rounded-lg px-3 py-2 text-xs shadow-md space-y-0.5">
                            <p className="font-semibold">{label}</p>
                            <p className="text-green-700">Inflow: {payload[0]?.value ?? 0}</p>
                            <p className="text-red-700">Outflow: {payload[1]?.value ?? 0}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="inflow" fill="hsl(160, 50%, 40%)" radius={[2, 2, 0, 0]} maxBarSize={12} />
                    <Bar dataKey="outflow" fill="hsl(348, 45%, 42%)" radius={[2, 2, 0, 0]} maxBarSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {counterparts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top Counterparts</h4>
                <div className="space-y-1">
                  {counterparts.map((c, i) => (
                    <div key={c.museum_id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <span className="truncate text-xs">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs tabular-nums">
                        <span className="text-green-700 dark:text-green-400">{c.inflow} in</span>
                        <span className="text-red-700 dark:text-red-400">{c.outflow} out</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {relatedArtworks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related Artworks</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {relatedArtworks.map(a => {
                    const imageUrl = getArtworkImageUrl(a);
                    return (
                      <button key={a.artwork_id} onClick={() => onArtworkSelect(a.artwork_id)}
                        className="group text-left rounded-lg border border-border/60 overflow-hidden hover:border-primary/40 transition-all">
                        <div className="aspect-square bg-muted overflow-hidden">
                          {imageUrl ? (
                            <img src={imageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><Landmark className="h-5 w-5" /></div>
                          )}
                        </div>
                        <div className="p-1.5"><p className="text-[10px] font-medium line-clamp-1 group-hover:text-primary transition-colors">{a.title}</p></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rankings - adapts to granularity */}
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-5'}>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold">Top Inflow</h3>
            </div>
            <div className="space-y-1">
              {(topInflow as any[]).map((s: any, i: number) => (
                <div
                  key={s.museum_id || s.name}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    geoGranularity === 'museum' ? 'cursor-pointer' : '',
                    geoGranularity === 'museum' && selectedMuseum === s.museum_id ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/40'
                  )}
                  onClick={() => geoGranularity === 'museum' && handleMuseumToggle(s.museum_id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <span className="truncate text-xs sm:text-sm">{s.museum_name || s.displayName || s.name}</span>
                  </div>
                  <span className="text-green-700 dark:text-green-400 font-semibold shrink-0 ml-2 tabular-nums">
                    {geoGranularity === 'museum' ? getFlowValue(s, 'in') : s.inflow}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <h3 className="text-sm font-semibold">Top Outflow</h3>
            </div>
            <div className="space-y-1">
              {(topOutflow as any[]).map((s: any, i: number) => (
                <div
                  key={s.museum_id || s.name}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    geoGranularity === 'museum' ? 'cursor-pointer' : '',
                    geoGranularity === 'museum' && selectedMuseum === s.museum_id ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/40'
                  )}
                  onClick={() => geoGranularity === 'museum' && handleMuseumToggle(s.museum_id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <span className="truncate text-xs sm:text-sm">{s.museum_name || s.displayName || s.name}</span>
                  </div>
                  <span className="text-red-700 dark:text-red-400 font-semibold shrink-0 ml-2 tabular-nums">
                    {geoGranularity === 'museum' ? getFlowValue(s, 'out') : s.outflow}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Summary Table (museum level) */}
      {geoGranularity === 'museum' && (
        <Card className="border-border/60 overflow-hidden">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border/60">
              <h3 className="text-sm font-semibold">All Museums</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{flowStats.length} museums · Click to explore</p>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Museum</th>
                    <th className="text-right p-3 text-xs font-medium text-green-700 dark:text-green-400">In</th>
                    <th className="text-right p-3 text-xs font-medium text-red-700 dark:text-red-400">Out</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {[...flowStats]
                    .sort((a, b) => Math.abs(getFlowValue(b, 'net')) - Math.abs(getFlowValue(a, 'net')))
                    .map(s => {
                      const net = getFlowValue(s, 'net');
                      const isSelected = selectedMuseum === s.museum_id;
                      return (
                        <tr key={s.museum_id}
                          className={cn("cursor-pointer transition-colors", isSelected ? 'bg-primary/5' : 'hover:bg-muted/40')}
                          onClick={() => handleMuseumToggle(s.museum_id)}>
                          <td className="p-3 truncate max-w-[200px]">{s.museum_name}</td>
                          <td className="p-3 text-right text-green-700 dark:text-green-400 tabular-nums">{getFlowValue(s, 'in')}</td>
                          <td className="p-3 text-right text-red-700 dark:text-red-400 tabular-nums">{getFlowValue(s, 'out')}</td>
                          <td className={cn("p-3 text-right font-semibold tabular-nums",
                            net > 0 ? 'text-green-700 dark:text-green-400' : net < 0 ? 'text-red-700 dark:text-red-400' : '')}>
                            {net > 0 ? '+' : ''}{net}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
