import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Plus, Minus, Globe, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import type { Exhibition } from '@/types/exhibition';
import type { Museum } from '@/types/museum';

interface MuseumExhibitionGroup {
  museum: Museum;
  exhibitions: Exhibition[];
}

interface ExhibitionMapProps {
  exhibitions: Exhibition[];
  museumMap: Map<string, Museum>;
  onSelectMuseum: (group: MuseumExhibitionGroup) => void;
  userLocation?: { latitude: number; longitude: number; accuracy?: number | null } | null;
  className?: string;
}

// Create cluster icon matching MuMu style
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  let dimensions = 36;
  let size = 'small';

  if (count >= 50) { size = 'large'; dimensions = 48; }
  else if (count >= 10) { size = 'medium'; dimensions = 42; }

  return L.divIcon({
    className: `mumu-cluster mumu-cluster-${size}`,
    html: `
      <div style="
        width: ${dimensions}px; height: ${dimensions}px;
        background: hsl(348, 45%, 32%);
        border: 3px solid hsl(40, 33%, 97%);
        border-radius: 50%;
        box-shadow: 0 3px 10px hsla(24, 10%, 18%, 0.3);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        font-family: 'Source Sans 3', sans-serif;
        font-weight: 600;
        font-size: ${count >= 100 ? '12px' : '14px'};
        color: hsl(40, 33%, 97%);
      ">${count}</div>
    `,
    iconSize: [dimensions, dimensions],
    iconAnchor: [dimensions / 2, dimensions / 2],
  });
};

// Create museum marker with exhibition count badge
const createMuseumMarkerIcon = (exhibitionCount: number) => {
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div style="position: relative;">
        <div style="
          width: 28px; height: 28px;
          background: hsl(348, 45%, 32%);
          border: 2px solid hsl(40, 33%, 97%);
          border-radius: 50%;
          box-shadow: 0 2px 8px hsla(24, 10%, 18%, 0.25);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line x1="3" x2="21" y1="22" y2="22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="6" x2="6" y1="18" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="10" x2="10" y1="18" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="14" x2="14" y1="18" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="18" x2="18" y1="18" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polygon points="12 2 20 7 4 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <line x1="3" x2="21" y1="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        ${exhibitionCount > 0 ? `
        <div style="
          position: absolute; top: -6px; right: -6px;
          min-width: 18px; height: 18px; padding: 0 4px;
          background: hsl(43, 60%, 45%);
          border: 2px solid hsl(40, 33%, 97%);
          border-radius: 9px;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 10px; font-weight: 700;
          color: hsl(40, 33%, 97%);
          display: flex; align-items: center; justify-content: center;
        ">${exhibitionCount}</div>` : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// User location marker
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="user-location-wrapper">
        <div class="user-location-halo"></div>
        <div class="user-location-ring"></div>
        <div class="user-location-dot"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export function ExhibitionMap({
  exhibitions,
  museumMap,
  onSelectMuseum,
  userLocation,
  className = '',
}: ExhibitionMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Group exhibitions by museum
  const museumGroups = useMemo(() => {
    const groups = new Map<string, MuseumExhibitionGroup>();
    exhibitions.forEach(ex => {
      const museum = museumMap.get(ex.museum_id);
      if (!museum) return;
      const existing = groups.get(ex.museum_id);
      if (existing) {
        existing.exhibitions.push(ex);
      } else {
        groups.set(ex.museum_id, { museum, exhibitions: [ex] });
      }
    });
    return Array.from(groups.values());
  }, [exhibitions, museumMap]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [25, 0],
      zoom: 2,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapRef.current);

    clusterGroupRef.current = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15,
    });

    mapRef.current.addLayer(clusterGroupRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
        accuracyCircleRef.current = null;
      }
    };
  }, []);

  // Update user location
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const { latitude, longitude, accuracy } = userLocation;
    const latLng = L.latLng(latitude, longitude);

    if (accuracy && accuracy < 5000) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(latLng).setRadius(accuracy);
      } else {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: accuracy,
          fillColor: 'hsl(43, 60%, 45%)',
          fillOpacity: 0.08,
          stroke: false,
        }).addTo(mapRef.current);
      }
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latLng);
    } else {
      userMarkerRef.current = L.marker(latLng, {
        icon: createUserLocationIcon(),
        zIndexOffset: -100,
      }).addTo(mapRef.current);
    }
  }, [userLocation]);

  // Add markers for museum groups
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    clusterGroupRef.current.clearLayers();

    museumGroups.forEach(group => {
      const { museum, exhibitions: exs } = group;
      const icon = createMuseumMarkerIcon(exs.length);

      const marker = L.marker([museum.lat, museum.lng], { icon })
        .on('click', () => onSelectMuseum(group));

      // Build popup with thumbnails
      const thumbs = exs.slice(0, 2);
      const thumbHtml = thumbs.map(ex =>
        ex.cover_image_url
          ? `<img src="${ex.cover_image_url}" alt="" style="width:60px;height:40px;object-fit:cover;border-radius:3px;border:1px solid hsl(35,15%,82%);" onerror="this.style.display='none'" />`
          : `<div style="width:60px;height:40px;background:hsl(38,18%,90%);border-radius:3px;display:flex;align-items:center;justify-content:center;border:1px solid hsl(35,15%,82%);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(24,8%,45%)" stroke-width="2"><line x1="2" y1="2" x2="22" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M13.5 13.5 6 21"/><path d="M18 12l3 3"/></svg></div>`
      ).join('');

      const popupContent = `
        <div style="font-family:'Source Sans 3',sans-serif;min-width:180px;">
          <div style="font-family:'Cormorant Garamond',serif;font-weight:700;font-size:14px;color:hsl(24,10%,18%);margin-bottom:4px;">${museum.name}</div>
          <div style="font-size:12px;color:hsl(24,8%,45%);margin-bottom:8px;">${exs.length} exhibition${exs.length > 1 ? 's' : ''}</div>
          <div style="display:flex;gap:6px;margin-bottom:8px;">${thumbHtml}</div>
          <button onclick="window.dispatchEvent(new CustomEvent('exhibition-map-view',{detail:'${museum.museum_id}'}))" style="
            width:100%;padding:6px 12px;
            background:hsl(348,45%,32%);color:hsl(40,33%,97%);
            border:none;border-radius:4px;cursor:pointer;
            font-family:'Source Sans 3',sans-serif;font-size:13px;font-weight:600;
          ">View Exhibitions</button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'mumu-popup',
        maxWidth: 240,
      });

      marker.bindTooltip(museum.name, {
        direction: 'top',
        offset: [0, -14],
        className: 'mumu-tooltip',
      });

      clusterGroupRef.current!.addLayer(marker);
    });

    // Auto-fit bounds
    if (museumGroups.length > 0) {
      const bounds = L.latLngBounds(
        museumGroups.map(g => L.latLng(g.museum.lat, g.museum.lng))
      );
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }
  }, [museumGroups, onSelectMuseum]);

  // Listen for popup button clicks
  useEffect(() => {
    const handler = (e: Event) => {
      const museumId = (e as CustomEvent).detail;
      const group = museumGroups.find(g => g.museum.museum_id === museumId);
      if (group) onSelectMuseum(group);
    };
    window.addEventListener('exhibition-map-view', handler);
    return () => window.removeEventListener('exhibition-map-view', handler);
  }, [museumGroups, onSelectMuseum]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleZoomToGlobal = () => {
    mapRef.current?.setView([25, 0], 2, { animate: true });
  };

  return (
    <div className={`relative w-full ${className}`} style={{ minHeight: '500px', height: 'calc(100vh - 260px)' }}>
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden border border-border" />

      {/* No results overlay */}
      {museumGroups.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg z-[500]">
          <ImageOff className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="font-display text-lg font-semibold text-foreground mb-1">
            {t('exhibitions.noResults')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('exhibitions.noResultsHint')}
          </p>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-[1000]">
        <div className="flex flex-col rounded-md overflow-hidden shadow-md">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="bg-background/95 backdrop-blur-sm rounded-none rounded-t-md border-b-0 hover:bg-primary hover:text-primary-foreground hover:border-primary"
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="bg-background/95 backdrop-blur-sm rounded-none rounded-b-md hover:bg-primary hover:text-primary-foreground hover:border-primary"
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomToGlobal}
          className="bg-background/95 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary"
          title="World view"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
