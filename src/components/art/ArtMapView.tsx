import { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.heat';
import { Plus, Minus, Globe, Crosshair, ImageOff, MapPin, Flame, Layers, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { EnrichedArtwork } from '@/types/art';
import type { ArtMuseumGroup } from './ArtMuseumDrawer';
import { ArtMuseumPanel } from './ArtMuseumDrawer';
import { getArtworkImageUrl } from '@/types/art';

// Extend L to include heat
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

type MapMode = 'pins' | 'heat';
interface ArtMapViewProps {
  artworks: EnrichedArtwork[];
  onSelectMuseum: (group: ArtMuseumGroup) => void;
  selectedGroup: ArtMuseumGroup | null;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onArtworkClick: (artwork: EnrichedArtwork) => void;
  filteredArtworkIds?: Set<string>;
  className?: string;
}

// Create cluster icon matching MuMu style
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  let dimensions = 36;
  if (count >= 50) dimensions = 48;
  else if (count >= 10) dimensions = 42;

  return L.divIcon({
    className: 'mumu-cluster',
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

// Create museum marker with artwork count badge
const createMuseumMarkerIcon = (artworkCount: number) => {
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="13.5" cy="6.5" r=".5" fill="white"/>
            <circle cx="17.5" cy="10.5" r=".5" fill="white"/>
            <circle cx="8.5" cy="7.5" r=".5" fill="white"/>
            <circle cx="6.5" cy="12.5" r=".5" fill="white"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
          </svg>
        </div>
        ${artworkCount > 1 ? `
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
        ">${artworkCount}</div>` : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

// Create user location icon (gold dot with halo)
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

export function ArtMapView({
  artworks,
  onSelectMuseum,
  selectedGroup,
  isDrawerOpen,
  onCloseDrawer,
  onArtworkClick,
  filteredArtworkIds,
  className = '',
}: ArtMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyRef = useRef<L.Circle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapMode, setMapMode] = useState<MapMode>('pins');
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { latitude, longitude, accuracy, error: geoError } = useGeolocation();

  // Group artworks by museum
  const museumGroups = useMemo((): ArtMuseumGroup[] => {
    const groups = new Map<string, ArtMuseumGroup>();
    for (const artwork of artworks) {
      if (!artwork.museum_lat || !artwork.museum_lng) continue;
      if (isNaN(artwork.museum_lat) || isNaN(artwork.museum_lng)) continue;

      const existing = groups.get(artwork.museum_id);
      if (existing) {
        existing.artworks.push(artwork);
      } else {
        groups.set(artwork.museum_id, {
          museumId: artwork.museum_id,
          museumName: artwork.museum_name,
          lat: artwork.museum_lat,
          lng: artwork.museum_lng,
          artworks: [artwork],
        });
      }
    }
    return Array.from(groups.values());
  }, [artworks]);

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
      }
    };
  }, []);

  // Update markers / heatmap when data or mode changes
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    // Clear all visualization layers
    clusterGroupRef.current.clearLayers();
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (mapMode === 'pins') {
      // Show cluster group layer
      if (!mapRef.current.hasLayer(clusterGroupRef.current)) {
        mapRef.current.addLayer(clusterGroupRef.current);
      }

      museumGroups.forEach(group => {
        const icon = createMuseumMarkerIcon(group.artworks.length);

        const marker = L.marker([group.lat, group.lng], { icon })
          .on('click', () => onSelectMuseum(group));

        // Build popup with thumbnails
        const thumbs = group.artworks.slice(0, 3);
        const thumbHtml = thumbs.map(artwork => {
          const imgUrl = getArtworkImageUrl(artwork);
          return imgUrl
            ? `<img src="${imgUrl}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:3px;border:1px solid hsl(35,15%,82%);" onerror="this.style.display='none'" />`
            : '';
        }).filter(Boolean).join('');

        const popupContent = `
          <div style="font-family:'Source Sans 3',sans-serif;min-width:180px;">
            <div style="font-family:'Cormorant Garamond',serif;font-weight:700;font-size:14px;color:hsl(24,10%,18%);margin-bottom:4px;">${group.museumName}</div>
            <div style="font-size:12px;color:hsl(24,8%,45%);margin-bottom:8px;">${group.artworks.length} ${t('art.artworks')}</div>
            ${thumbHtml ? `<div style="display:flex;gap:4px;margin-bottom:8px;">${thumbHtml}</div>` : ''}
            <button onclick="window.dispatchEvent(new CustomEvent('art-map-view',{detail:'${group.museumId}'}))" style="
              width:100%;padding:6px 12px;
              background:hsl(348,45%,32%);color:hsl(40,33%,97%);
              border:none;border-radius:4px;cursor:pointer;
              font-family:'Source Sans 3',sans-serif;font-size:13px;font-weight:600;
            ">${t('art.viewArtworks' as any) || 'View Artworks'}</button>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: true,
          className: 'mumu-popup',
          maxWidth: 240,
        });

        marker.bindTooltip(group.museumName, {
          direction: 'top',
          offset: [0, -14],
          className: 'mumu-tooltip',
        });

        clusterGroupRef.current!.addLayer(marker);
      });
    } else {
      // Heatmap mode — hide cluster group, show heat layer
      if (mapRef.current.hasLayer(clusterGroupRef.current)) {
        mapRef.current.removeLayer(clusterGroupRef.current);
      }

      if (museumGroups.length > 0) {
        const heatPoints: [number, number, number][] = museumGroups.map(g => [
          g.lat,
          g.lng,
          g.artworks.length,
        ]);

        heatLayerRef.current = L.heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          minOpacity: 0.3,
          gradient: {
            0.4: 'hsl(43, 60%, 70%)',
            0.65: 'hsl(348, 45%, 50%)',
            1: 'hsl(348, 45%, 32%)',
          },
        });

        mapRef.current.addLayer(heatLayerRef.current);
      }
    }

    // Auto-fit bounds
    if (museumGroups.length > 0) {
      const bounds = L.latLngBounds(
        museumGroups.map(g => L.latLng(g.lat, g.lng))
      );
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }
  }, [museumGroups, mapMode, onSelectMuseum, t]);

  // Listen for popup button clicks
  useEffect(() => {
    const handler = (e: Event) => {
      const museumId = (e as CustomEvent).detail;
      const group = museumGroups.find(g => g.museumId === museumId);
      if (group) onSelectMuseum(group);
    };
    window.addEventListener('art-map-view', handler);
    return () => window.removeEventListener('art-map-view', handler);
  }, [museumGroups, onSelectMuseum]);

  // User location marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up previous
    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userAccuracyRef.current) {
      mapRef.current.removeLayer(userAccuracyRef.current);
      userAccuracyRef.current = null;
    }

    if (latitude && longitude && !geoError) {
      const icon = createUserLocationIcon();
      userMarkerRef.current = L.marker([latitude, longitude], {
        icon,
        zIndexOffset: -100,
        interactive: false,
      }).addTo(mapRef.current);

      if (accuracy && accuracy < 50000) {
        userAccuracyRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: 'hsl(43, 60%, 45%)',
          fillColor: 'hsl(43, 60%, 45%)',
          fillOpacity: 0.08,
          weight: 0,
          interactive: false,
        }).addTo(mapRef.current);
      }
    }
  }, [latitude, longitude, accuracy, geoError]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleZoomToGlobal = () => {
    mapRef.current?.setView([25, 0], 2, { animate: true });
  };
  const handleLocateMe = () => {
    if (latitude && longitude) {
      mapRef.current?.setView([latitude, longitude], 11, { animate: true, duration: 0.3 });
    }
  };

  return (
    <div className={`relative w-full ${className}`} style={{ minHeight: '500px', height: 'calc(100vh - 260px)' }}>
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden border border-border" />

      {/* No results overlay */}
      {museumGroups.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg z-[500]">
          <ImageOff className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="font-display text-lg font-semibold text-foreground mb-1">
            {t('art.noResults')}
          </p>
          <p className="text-sm text-muted-foreground">
            {t('art.tryAdjustingFilters')}
          </p>
        </div>
      )}

      {/* Desktop: In-map museum panel (LEFT side) */}
      {!isMobile && isDrawerOpen && selectedGroup && (
        <ArtMuseumPanel
          group={selectedGroup}
          onClose={onCloseDrawer}
          onArtworkClick={onArtworkClick}
          filteredArtworkIds={filteredArtworkIds}
        />
      )}

      {/* Map Controls (bottom-right) */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-[1000]">
        {/* Layers toggle */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/95 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary"
              title="Layers"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="left" align="start" className="w-40 p-1 z-[9999]">
            <button
              onClick={() => setMapMode('pins')}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mapMode === 'pins'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Pins</span>
              {mapMode === 'pins' && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
            <button
              onClick={() => setMapMode('heat')}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mapMode === 'heat'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Flame className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Heatmap</span>
              {mapMode === 'heat' && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          </PopoverContent>
        </Popover>

        {/* Zoom */}
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
          onClick={handleLocateMe}
          className="bg-background/95 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary"
          title="My location"
        >
          <Crosshair className="h-4 w-4" />
        </Button>
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
