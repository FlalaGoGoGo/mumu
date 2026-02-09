import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { PassportMuseum } from '@/hooks/usePassportData';

interface PassportVisitedMapProps {
  museums: PassportMuseum[];
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

export function PassportVisitedMap({ museums }: PassportVisitedMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  // Only visited/completed museums
  const visitedMuseums = museums.filter(
    (m) => m.status === 'visited' || m.status === 'completed'
  );

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

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19 }
    ).addTo(map);

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

    if (visitedMuseums.length === 0) {
      clusterRef.current = null;
      return;
    }

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: createClusterIcon,
    });

    visitedMuseums.forEach((pm) => {
      const { museum, status, visitDate } = pm;

      const markerOptions: L.CircleMarkerOptions =
        status === 'completed'
          ? { radius: 8, fillColor: 'hsl(43, 60%, 45%)', fillOpacity: 1, color: 'hsl(40, 33%, 97%)', weight: 3 }
          : { radius: 7, fillColor: 'hsl(43, 60%, 45%)', fillOpacity: 1, color: 'hsl(40, 33%, 97%)', weight: 2 };

      const marker = L.circleMarker([museum.lat, museum.lng], markerOptions);

      const statusLabel = status === 'completed' ? 'Completed ✦' : 'Visited';
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

    const bounds = L.latLngBounds(
      visitedMuseums.map((pm) => [pm.museum.lat, pm.museum.lng])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }, [visitedMuseums]);

  return (
    <div className="relative">
      {visitedMuseums.length === 0 ? (
        <div
          className="w-full h-[220px] md:h-[280px] rounded-b-lg border-x border-b border-border overflow-hidden bg-muted flex items-center justify-center"
          style={{ zIndex: 1 }}
        >
          <p className="text-muted-foreground text-sm text-center px-6">
            No visited museums yet — stamp your first one!
          </p>
        </div>
      ) : (
        <div
          ref={mapRef}
          className="w-full h-[220px] md:h-[280px] rounded-b-lg border-x border-b border-border overflow-hidden"
          style={{ zIndex: 1 }}
        />
      )}
    </div>
  );
}
