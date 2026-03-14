import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
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
  const flowStats = useMemo(() => {
    const stats = new Map<string, { inflow: number; outflow: number; artworkIds: Set<string> }>();

    for (const m of movements) {
      // Lender (outflow)
      if (!stats.has(m.lender_museum_id)) {
        stats.set(m.lender_museum_id, { inflow: 0, outflow: 0, artworkIds: new Set() });
      }
      const lender = stats.get(m.lender_museum_id)!;
      lender.outflow++;
      lender.artworkIds.add(m.artwork_id);

      // Borrower (inflow)
      if (!stats.has(m.borrower_museum_id)) {
        stats.set(m.borrower_museum_id, { inflow: 0, outflow: 0, artworkIds: new Set() });
      }
      const borrower = stats.get(m.borrower_museum_id)!;
      borrower.inflow++;
      borrower.artworkIds.add(m.artwork_id);
    }

    const artworkMap = new Map(artworks.map(a => [a.artwork_id, a]));

    const result: MuseumFlowStats[] = [];
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
        top_artworks: Array.from(s.artworkIds).slice(0, 5).map(id => ({
          artwork_id: id,
          title: artworkMap.get(id)?.title || id,
        })),
      });
    }
    return result;
  }, [movements, museumMap, artworks]);

  const allPoints: [number, number][] = flowStats.map(s => [s.lat, s.lng]);
  const maxMagnitude = Math.max(1, ...flowStats.map(s => Math.abs(s.net_flow)));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden" style={{ height: 500 }}>
        <MapContainer center={[48, 2]} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {allPoints.length > 1 && <FitBounds points={allPoints} />}

          {flowStats.map(s => {
            const magnitude = Math.abs(s.net_flow);
            const radius = 6 + (magnitude / maxMagnitude) * 18;
            const color = s.net_flow > 0 ? 'hsl(160, 50%, 40%)' : s.net_flow < 0 ? 'hsl(348, 45%, 42%)' : 'hsl(43, 60%, 45%)';

            return (
              <CircleMarker
                key={s.museum_id}
                center={[s.lat, s.lng]}
                radius={radius}
                pathOptions={{
                  color: 'white',
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.7,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1 min-w-[180px]">
                    <p className="font-semibold">{s.museum_name}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <span className="text-muted-foreground">Inflow:</span>
                      <span className="font-medium text-green-700">{s.inflow_count}</span>
                      <span className="text-muted-foreground">Outflow:</span>
                      <span className="font-medium text-red-700">{s.outflow_count}</span>
                      <span className="text-muted-foreground">Net flow:</span>
                      <span className={`font-bold ${s.net_flow > 0 ? 'text-green-700' : s.net_flow < 0 ? 'text-red-700' : ''}`}>
                        {s.net_flow > 0 ? '+' : ''}{s.net_flow}
                      </span>
                    </div>
                    {s.top_artworks.length > 0 && (
                      <div className="pt-1 border-t">
                        <p className="font-medium mb-0.5">Related artworks:</p>
                        {s.top_artworks.map(a => (
                          <p key={a.artwork_id} className="truncate">{a.title}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Legend */}
          <div className="leaflet-bottom leaflet-left">
            <div className="leaflet-control bg-background/90 backdrop-blur rounded-md p-2 m-2 text-xs space-y-1 border shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(160,50%,40%)' }} />
                <span>Net importer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(348,45%,42%)' }} />
                <span>Net exporter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(43,60%,45%)' }} />
                <span>Balanced</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Size = magnitude</p>
            </div>
          </div>
        </MapContainer>
      </div>

      {/* Summary table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">Museum Flow Summary</h3>
          <p className="text-xs text-muted-foreground">{flowStats.length} museums involved</p>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b">
              <tr>
                <th className="text-left p-2 text-xs font-medium text-muted-foreground">Museum</th>
                <th className="text-right p-2 text-xs font-medium text-green-700">In</th>
                <th className="text-right p-2 text-xs font-medium text-red-700">Out</th>
                <th className="text-right p-2 text-xs font-medium text-muted-foreground">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flowStats
                .sort((a, b) => Math.abs(b.net_flow) - Math.abs(a.net_flow))
                .map(s => (
                  <tr key={s.museum_id} className="hover:bg-muted/50">
                    <td className="p-2 truncate max-w-[200px]">{s.museum_name}</td>
                    <td className="p-2 text-right text-green-700">{s.inflow_count}</td>
                    <td className="p-2 text-right text-red-700">{s.outflow_count}</td>
                    <td className={`p-2 text-right font-semibold ${s.net_flow > 0 ? 'text-green-700' : s.net_flow < 0 ? 'text-red-700' : ''}`}>
                      {s.net_flow > 0 ? '+' : ''}{s.net_flow}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
