import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ArtworkMovement, MuseumFlowStats } from '@/types/movement';
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
}

type CountMode = 'events' | 'artworks';

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

export function MuseumBalanceView({ movements, museumMap, artworks }: Props) {
  const isMobile = useIsMobile();
  const [countMode, setCountMode] = useState<CountMode>('events');
  const [selectedMuseum, setSelectedMuseum] = useState<string | null>(null);

  const flowStats = useMemo(() => {
    const stats = new Map<string, { inflow: number; outflow: number; artworkIdsIn: Set<string>; artworkIdsOut: Set<string> }>();

    for (const m of movements) {
      if (!stats.has(m.lender_museum_id)) {
        stats.set(m.lender_museum_id, { inflow: 0, outflow: 0, artworkIdsIn: new Set(), artworkIdsOut: new Set() });
      }
      const lender = stats.get(m.lender_museum_id)!;
      lender.outflow++;
      lender.artworkIdsOut.add(m.artwork_id);

      if (!stats.has(m.borrower_museum_id)) {
        stats.set(m.borrower_museum_id, { inflow: 0, outflow: 0, artworkIdsIn: new Set(), artworkIdsOut: new Set() });
      }
      const borrower = stats.get(m.borrower_museum_id)!;
      borrower.inflow++;
      borrower.artworkIdsIn.add(m.artwork_id);
    }

    const artworkMap = new Map(artworks.map(a => [a.artwork_id, a]));

    const result: (MuseumFlowStats & { unique_in: number; unique_out: number })[] = [];
    for (const [museumId, s] of stats) {
      const museum = museumMap.get(museumId);
      if (!museum || (museum.lat === 0 && museum.lng === 0)) continue;
      result.push({
        museum_id: museumId,
        museum_name: museum.name,
        lat: museum.lat,
        lng: museum.lng,
        inflow_count: s.inflow,
        outflow_count: s.outflow,
        net_flow: s.inflow - s.outflow,
        unique_in: s.artworkIdsIn.size,
        unique_out: s.artworkIdsOut.size,
        top_artworks: Array.from(new Set([...s.artworkIdsIn, ...s.artworkIdsOut])).slice(0, 5).map(id => ({
          artwork_id: id,
          title: artworkMap.get(id)?.title || id,
        })),
      });
    }
    return result;
  }, [movements, museumMap, artworks]);

  const allPoints: [number, number][] = flowStats.map(s => [s.lat, s.lng]);

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

  const maxMagnitude = Math.max(1, ...flowStats.map(s => Math.abs(getFlowValue(s, 'net'))));

  // Top inflow/outflow rankings
  const topInflow = useMemo(() => (
    [...flowStats]
      .sort((a, b) => getFlowValue(b, 'in') - getFlowValue(a, 'in'))
      .slice(0, 5)
  ), [flowStats, countMode]);

  const topOutflow = useMemo(() => (
    [...flowStats]
      .sort((a, b) => getFlowValue(b, 'out') - getFlowValue(a, 'out'))
      .slice(0, 5)
  ), [flowStats, countMode]);

  return (
    <div className="space-y-5">
      {/* Count Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Count by:</span>
        <div className="flex gap-1 rounded-lg border border-border/60 p-0.5">
          <Button
            variant={countMode === 'events' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => setCountMode('events')}
          >
            Event Count
          </Button>
          <Button
            variant={countMode === 'artworks' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => setCountMode('artworks')}
          >
            Unique Artworks
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-xl border border-border/60 overflow-hidden relative" style={{ height: isMobile ? 350 : 480 }}>
        <MapContainer center={[48, 2]} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {allPoints.length > 1 && <FitBounds points={allPoints} />}

          {flowStats.map(s => {
            const netValue = getFlowValue(s, 'net');
            const magnitude = Math.abs(netValue);
            const radius = 6 + (magnitude / maxMagnitude) * 18;
            const color = netValue > 0 ? 'hsl(160, 50%, 40%)' : netValue < 0 ? 'hsl(348, 45%, 42%)' : 'hsl(43, 60%, 45%)';
            const isSelected = selectedMuseum === s.museum_id;
            const isDimmed = selectedMuseum !== null && !isSelected;

            return (
              <CircleMarker
                key={s.museum_id}
                center={[s.lat, s.lng]}
                radius={isSelected ? radius + 3 : radius}
                pathOptions={{
                  color: isSelected ? 'hsl(348, 55%, 32%)' : 'white',
                  weight: isSelected ? 3 : 2,
                  fillColor: color,
                  fillOpacity: isDimmed ? 0.2 : 0.75,
                }}
                eventHandlers={{
                  click: () => setSelectedMuseum(prev => prev === s.museum_id ? null : s.museum_id),
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[180px]">
                    <p className="font-semibold">{s.museum_name}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <span className="text-muted-foreground">Inflow:</span>
                      <span className="font-medium text-green-700">{getFlowValue(s, 'in')}</span>
                      <span className="text-muted-foreground">Outflow:</span>
                      <span className="font-medium text-red-700">{getFlowValue(s, 'out')}</span>
                      <span className="text-muted-foreground">Net:</span>
                      <span className={cn("font-bold", netValue > 0 ? 'text-green-700' : netValue < 0 ? 'text-red-700' : '')}>
                        {netValue > 0 ? '+' : ''}{netValue}
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
          <p className="text-[10px] text-muted-foreground">
            Counting: {countMode === 'events' ? 'events' : 'unique artworks'}
          </p>
        </div>
      </div>

      {/* Top Rankings */}
      <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-5'}>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold">Top Inflow</h3>
            </div>
            <div className="space-y-2">
              {topInflow.map((s, i) => (
                <div
                  key={s.museum_id}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                    selectedMuseum === s.museum_id ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/40'
                  )}
                  onClick={() => setSelectedMuseum(prev => prev === s.museum_id ? null : s.museum_id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <span className="truncate">{s.museum_name}</span>
                  </div>
                  <span className="text-green-700 font-semibold shrink-0 ml-2 tabular-nums">{getFlowValue(s, 'in')}</span>
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
            <div className="space-y-2">
              {topOutflow.map((s, i) => (
                <div
                  key={s.museum_id}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                    selectedMuseum === s.museum_id ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/40'
                  )}
                  onClick={() => setSelectedMuseum(prev => prev === s.museum_id ? null : s.museum_id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <span className="truncate">{s.museum_name}</span>
                  </div>
                  <span className="text-red-700 font-semibold shrink-0 ml-2 tabular-nums">{getFlowValue(s, 'out')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary table */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border/60">
            <h3 className="text-sm font-semibold">Museum Flow Summary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{flowStats.length} museums involved</p>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Museum</th>
                  <th className="text-right p-3 text-xs font-medium text-green-700">In</th>
                  <th className="text-right p-3 text-xs font-medium text-red-700">Out</th>
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
                      <tr
                        key={s.museum_id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                        )}
                        onClick={() => setSelectedMuseum(prev => prev === s.museum_id ? null : s.museum_id)}
                      >
                        <td className="p-3 truncate max-w-[200px]">{s.museum_name}</td>
                        <td className="p-3 text-right text-green-700 tabular-nums">{getFlowValue(s, 'in')}</td>
                        <td className="p-3 text-right text-red-700 tabular-nums">{getFlowValue(s, 'out')}</td>
                        <td className={cn("p-3 text-right font-semibold tabular-nums", net > 0 ? 'text-green-700' : net < 0 ? 'text-red-700' : '')}>
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
    </div>
  );
}
