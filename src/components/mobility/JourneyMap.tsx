import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ArtworkMovement } from '@/types/movement';
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
  homeMuseum: MuseumPoint | null;
}

// Create curved arc points between two coordinates
function createArc(from: [number, number], to: [number, number], segments = 30): [number, number][] {
  const points: [number, number][] = [];
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dist = Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2));
  const offset = dist * 0.2;
  // Offset perpendicular to the line
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

const homeIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:hsl(348,45%,32%);border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const borrowerIcon = new L.DivIcon({
  className: '',
  html: `<div style="width:10px;height:10px;background:hsl(43,60%,45%);border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useMemo(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    }
  }, [points, map]);
  return null;
}

const ARC_COLORS = [
  'hsl(348, 45%, 42%)',
  'hsl(210, 50%, 45%)',
  'hsl(160, 40%, 40%)',
  'hsl(280, 35%, 45%)',
  'hsl(30, 50%, 45%)',
];

export function JourneyMap({ movements, museumMap, homeMuseum }: Props) {
  const { arcs, allPoints, involvedMuseums } = useMemo(() => {
    const arcs: { positions: [number, number][]; movement: ArtworkMovement; color: string }[] = [];
    const allPts: [number, number][] = [];
    const involved = new Map<string, MuseumPoint>();

    if (homeMuseum) {
      allPts.push([homeMuseum.lat, homeMuseum.lng]);
      involved.set(homeMuseum.museum_id, homeMuseum);
    }

    movements.forEach((m, idx) => {
      const from = museumMap.get(m.lender_museum_id);
      const to = museumMap.get(m.borrower_museum_id);
      if (!from || !to || (from.lat === 0 && from.lng === 0) || (to.lat === 0 && to.lng === 0)) return;

      const positions = createArc([from.lat, from.lng], [to.lat, to.lng]);
      arcs.push({ positions, movement: m, color: ARC_COLORS[idx % ARC_COLORS.length] });
      allPts.push([from.lat, from.lng], [to.lat, to.lng]);
      involved.set(from.museum_id, from);
      involved.set(to.museum_id, to);
    });

    return { arcs, allPoints: allPts, involvedMuseums: Array.from(involved.values()) };
  }, [movements, museumMap, homeMuseum]);

  const center: [number, number] = allPoints.length > 0
    ? [allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length, allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length]
    : [48, 2];

  return (
    <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {allPoints.length > 1 && <FitBounds points={allPoints} />}

      {/* Arcs */}
      {arcs.map((arc, i) => (
        <Polyline
          key={i}
          positions={arc.positions}
          pathOptions={{
            color: arc.color,
            weight: 2.5,
            opacity: 0.75,
            dashArray: '6 4',
          }}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <p className="font-semibold">{arc.movement.artwork_title}</p>
              <p>{museumMap.get(arc.movement.lender_museum_id)?.name} → {museumMap.get(arc.movement.borrower_museum_id)?.name}</p>
              <p>{arc.movement.start_date} – {arc.movement.end_date}</p>
              {arc.movement.related_exhibition_name && <p className="italic">{arc.movement.related_exhibition_name}</p>}
              {arc.movement.source_url && (
                <a href={arc.movement.source_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Source</a>
              )}
            </div>
          </Popup>
        </Polyline>
      ))}

      {/* Museum markers */}
      {involvedMuseums.map(m => (
        <Marker
          key={m.museum_id}
          position={[m.lat, m.lng]}
          icon={homeMuseum?.museum_id === m.museum_id ? homeIcon : borrowerIcon}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">{m.name}</p>
              {homeMuseum?.museum_id === m.museum_id && <p className="text-muted-foreground">Home Museum</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Legend */}
      <div className="leaflet-bottom leaflet-left">
        <div className="leaflet-control bg-background/90 backdrop-blur rounded-md p-2 m-2 text-xs space-y-1 border shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(348,45%,32%)' }} />
            <span>Home museum</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(43,60%,45%)' }} />
            <span>Borrower</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 border-t-2 border-dashed" style={{ borderColor: 'hsl(348,45%,42%)' }} />
            <span>Movement arc</span>
          </div>
        </div>
      </div>
    </MapContainer>
  );
}
