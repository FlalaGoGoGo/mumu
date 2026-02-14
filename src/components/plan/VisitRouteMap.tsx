import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import type { ItineraryDay } from '@/lib/plannerUtils';
import 'leaflet/dist/leaflet.css';

interface VisitRouteMapProps {
  itinerary: ItineraryDay[];
}

const DAY_COLORS = [
  'hsl(348, 45%, 32%)',   // primary red
  'hsl(43, 60%, 45%)',    // accent gold
  'hsl(200, 60%, 40%)',   // blue
  'hsl(140, 40%, 35%)',   // green
  'hsl(280, 40%, 45%)',   // purple
  'hsl(20, 60%, 45%)',    // orange
  'hsl(180, 40%, 35%)',   // teal
];

function createNumberedIcon(number: number, dayIndex: number) {
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
  return L.divIcon({
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${color}; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 12px; font-family: 'Cormorant Garamond', serif;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    ">${number}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function VisitRouteMap({ itinerary }: VisitRouteMapProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // null = all

  const allMuseums = useMemo(() => {
    return itinerary.flatMap((day, dayIdx) =>
      day.museums.map((im, museumIdx) => ({
        ...im,
        dayIdx,
        globalIdx: museumIdx,
      }))
    );
  }, [itinerary]);

  const displayMuseums = selectedDay !== null
    ? allMuseums.filter(m => m.dayIdx === selectedDay)
    : allMuseums;

  // Route lines per day
  const routeLines = useMemo(() => {
    const daysToShow = selectedDay !== null ? [selectedDay] : itinerary.map((_, i) => i);
    return daysToShow.map(dayIdx => {
      const dayMuseums = allMuseums.filter(m => m.dayIdx === dayIdx);
      const positions = dayMuseums.map(m => [m.museum.lat, m.museum.lng] as [number, number]);
      return { dayIdx, positions };
    }).filter(r => r.positions.length >= 2);
  }, [allMuseums, selectedDay, itinerary]);

  // Bounds
  const bounds = useMemo(() => {
    if (displayMuseums.length === 0) return undefined;
    const lats = displayMuseums.map(m => m.museum.lat);
    const lngs = displayMuseums.map(m => m.museum.lng);
    return L.latLngBounds(
      [Math.min(...lats) - 0.02, Math.min(...lngs) - 0.02],
      [Math.max(...lats) + 0.02, Math.max(...lngs) + 0.02]
    );
  }, [displayMuseums]);

  const center = bounds
    ? bounds.getCenter()
    : L.latLng(41.88, -87.63);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={13}
        bounds={bounds}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Route lines */}
        {routeLines.map(route => (
          <Polyline
            key={route.dayIdx}
            positions={route.positions}
            color={DAY_COLORS[route.dayIdx % DAY_COLORS.length]}
            weight={3}
            opacity={0.7}
            dashArray="8 6"
          />
        ))}

        {/* Markers */}
        {displayMuseums.map((m, idx) => (
          <Marker
            key={`${m.dayIdx}-${m.museum.museum_id}`}
            position={[m.museum.lat, m.museum.lng]}
            icon={createNumberedIcon(idx + 1, m.dayIdx)}
          >
            <Popup>
              <div className="font-body text-sm">
                <strong className="font-display">{m.museum.name}</strong>
                <br />
                <span className="text-xs text-muted-foreground">Day {m.dayIdx + 1}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Day selector overlay */}
      {itinerary.length > 1 && (
        <div className="absolute top-3 left-3 z-[1000] flex gap-1 bg-background/90 backdrop-blur-sm p-1.5 rounded-sm border border-border shadow-sm">
          <button
            onClick={() => setSelectedDay(null)}
            className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
              selectedDay === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            All
          </button>
          {itinerary.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDay(idx)}
              className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${
                selectedDay === idx ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              style={selectedDay === idx ? {} : { borderBottom: `2px solid ${DAY_COLORS[idx % DAY_COLORS.length]}` }}
            >
              Day {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
