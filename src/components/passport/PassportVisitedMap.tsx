import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.heat';
import type { PassportMuseum } from '@/hooks/usePassportData';

// Extend L to include heat
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer & { setLatLngs(latlngs: Array<[number, number, number?]>): void; setOptions(options: Record<string, unknown>): void; redraw(): void };
}

function getHeatParams(zoom: number): { radius: number; blur: number } {
  if (zoom <= 3) return { radius: 8, blur: 6 };
  if (zoom <= 5) return { radius: 12, blur: 10 };
  if (zoom <= 7) return { radius: 18, blur: 14 };
  if (zoom <= 9) return { radius: 28, blur: 18 };
  if (zoom <= 11) return { radius: 45, blur: 24 };
  return { radius: 60, blur: 30 };
}

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
  const heatLayerRef = useRef<L.Layer | null>(null);
  const lastZoomBucket = useRef<number>(-1);

  // Only visited/completed museums
  const visitedMuseums = museums.filter(
    (m) => m.status === 'visited' || m.status === 'completed'
  );

  const updateHeatParams = useCallback((map: L.Map) => {
    if (!heatLayerRef.current) return;
    const zoom = map.getZoom();
    // Bucket by the zoom table to avoid unnecessary redraws
    const bucket = zoom <= 3 ? 0 : zoom <= 5 ? 1 : zoom <= 7 ? 2 : zoom <= 9 ? 3 : zoom <= 11 ? 4 : 5;
    if (bucket === lastZoomBucket.current) return;
    lastZoomBucket.current = bucket;
    const { radius, blur } = getHeatParams(zoom);
    (heatLayerRef.current as any).setOptions({ radius, blur });
    (heatLayerRef.current as any).redraw();
  }, []);

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

    map.on('zoomend', () => updateHeatParams(map));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      heatLayerRef.current = null;
      lastZoomBucket.current = -1;
    };
  }, [updateHeatParams]);

  // Update markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
      lastZoomBucket.current = -1;
    }

    if (visitedMuseums.length === 0) {
      clusterRef.current = null;
      return;
    }

    // --- Cluster / pin layer ---
    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: createClusterIcon,
    });

    const heatPoints: Array<[number, number, number]> = [];

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

      heatPoints.push([museum.lat, museum.lng, 1]);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    // --- Heatmap layer (adaptive radius/blur) ---
    const initialParams = getHeatParams(map.getZoom());
    const heat = L.heatLayer(heatPoints, {
      minOpacity: 0.25,
      maxZoom: 18,
      radius: initialParams.radius,
      blur: initialParams.blur,
      gradient: {
        0.2: 'hsl(43, 50%, 85%)',
        0.4: 'hsl(43, 55%, 70%)',
        0.6: 'hsl(43, 60%, 55%)',
        0.8: 'hsl(35, 65%, 45%)',
        1.0: 'hsl(28, 70%, 38%)',
      },
    });
    map.addLayer(heat);
    heatLayerRef.current = heat;
    lastZoomBucket.current = -1;
    updateHeatParams(map);

    const bounds = L.latLngBounds(
      visitedMuseums.map((pm) => [pm.museum.lat, pm.museum.lng])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }, [visitedMuseums, updateHeatParams]);

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
