import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { PassportMuseum } from '@/hooks/usePassportData';
import { getCountryFlag } from '@/lib/countryFlag';
import { cn } from '@/lib/utils';

interface PassportWorldMapProps {
  museums: PassportMuseum[];
  mapFilter: 'visited' | 'planned' | 'both';
  onMapFilterChange: (filter: 'visited' | 'planned' | 'both') => void;
  countries: string[];
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
}

const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  let dim = 32;
  if (count >= 50) dim = 44;
  else if (count >= 10) dim = 38;

  return L.divIcon({
    className: 'mumu-cluster',
    html: `<div style="
      width:${dim}px;height:${dim}px;
      background:hsl(43,60%,45%);
      border:2.5px solid hsl(40,33%,97%);
      border-radius:50%;
      box-shadow:0 2px 8px hsla(24,10%,18%,0.3);
      display:flex;align-items:center;justify-content:center;
      font-family:'Source Sans 3',sans-serif;
      font-weight:600;font-size:${count >= 100 ? '11px' : '13px'};
      color:hsl(40,33%,97%);cursor:pointer;
    ">${count}</div>`,
    iconSize: [dim, dim],
    iconAnchor: [dim / 2, dim / 2],
  });
};

const MAP_FILTER_OPTIONS = [
  { value: 'visited' as const, label: 'Visited' },
  { value: 'planned' as const, label: 'Planned' },
  { value: 'both' as const, label: 'Both' },
];

export function PassportWorldMap({
  museums,
  mapFilter,
  onMapFilterChange,
  countries,
  selectedCountry,
  onCountrySelect,
}: PassportWorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [25, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const filtered = selectedCountry
      ? museums.filter((pm) => pm.museum.country === selectedCountry)
      : museums;

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: createClusterIcon,
    });

    filtered.forEach((pm) => {
      const { museum, status, visitDate } = pm;

      // Different marker styles per status
      let markerOptions: L.CircleMarkerOptions;
      if (status === 'planned') {
        markerOptions = { radius: 7, fillColor: 'transparent', fillOpacity: 0, color: 'hsl(43, 60%, 45%)', weight: 2.5 };
      } else if (status === 'completed') {
        markerOptions = { radius: 8, fillColor: 'hsl(43, 60%, 45%)', fillOpacity: 1, color: 'hsl(40, 33%, 97%)', weight: 3 };
      } else {
        markerOptions = { radius: 7, fillColor: 'hsl(43, 60%, 45%)', fillOpacity: 1, color: 'hsl(40, 33%, 97%)', weight: 2 };
      }

      const marker = L.circleMarker([museum.lat, museum.lng], markerOptions);

      const statusLabel = status === 'completed' ? 'Completed ✦' : status === 'planned' ? 'Planned' : 'Visited';
      const tooltipContent = `
        <div style="font-family:'Cormorant Garamond',serif;font-weight:600;font-size:14px">${museum.name}</div>
        <div style="font-size:12px;color:#666">${museum.city}, ${museum.country}</div>
        <div style="font-size:11px;color:#999;margin-top:2px">${statusLabel}${visitDate ? ` · ${new Date(visitDate).toLocaleDateString()}` : ''}</div>
      `;
      marker.bindTooltip(tooltipContent, { className: 'mumu-tooltip' });
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map((pm) => [pm.museum.lat, pm.museum.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }
  }, [museums, selectedCountry]);

  return (
    <div className="space-y-2">
      {/* Map filter toggle */}
      <div className="flex items-center gap-1">
        {MAP_FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onMapFilterChange(opt.value)}
            className={cn(
              'museum-chip flex-shrink-0 cursor-pointer transition-colors text-[10px]',
              mapFilter === opt.value && 'bg-primary text-primary-foreground border-primary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div
        ref={mapRef}
        className="w-full h-[220px] md:h-[280px] rounded-lg border border-border overflow-hidden"
        style={{ zIndex: 1 }}
      />

      {/* Country chips */}
      {countries.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => onCountrySelect(null)}
            className={cn(
              'museum-chip flex-shrink-0 cursor-pointer transition-colors',
              !selectedCountry && 'bg-primary text-primary-foreground border-primary'
            )}
          >
            All
          </button>
          {countries.map((country) => (
            <button
              key={country}
              onClick={() =>
                onCountrySelect(selectedCountry === country ? null : country)
              }
              className={cn(
                'museum-chip flex-shrink-0 cursor-pointer transition-colors',
                selectedCountry === country &&
                  'bg-primary text-primary-foreground border-primary'
              )}
            >
              {getCountryFlag(country)} {country}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
