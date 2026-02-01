import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Locate, Globe, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MiniMap } from './MiniMap';
import { useLanguage } from '@/lib/i18n';
import { getTileConfig } from '@/lib/mapTiles';
import type { Museum } from '@/types/museum';

interface MuseumMapProps {
  museums: Museum[];
  selectedMuseum: Museum | null;
  onSelectMuseum: (museum: Museum) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  className?: string;
}

// Create custom marker icons
const createMarkerIcon = (isAic: boolean) => {
  const color = isAic ? 'hsl(43, 60%, 45%)' : 'hsl(348, 45%, 32%)';
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${color};
        border: 2px solid hsl(40, 33%, 97%);
        border-radius: 50%;
        box-shadow: 0 2px 8px hsla(24, 10%, 18%, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/>
          <path d="M5 21V7l7-4 7 4v14"/>
          <path d="M9 21v-8h6v8"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const createSelectedMarkerIcon = (isAic: boolean) => {
  const color = isAic ? 'hsl(43, 60%, 45%)' : 'hsl(348, 45%, 32%)';
  return L.divIcon({
    className: 'custom-marker-wrapper selected',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${color};
        border: 3px solid hsl(40, 33%, 97%);
        border-radius: 50%;
        box-shadow: 0 4px 12px hsla(24, 10%, 18%, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transform: scale(1.1);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/>
          <path d="M5 21V7l7-4 7 4v14"/>
          <path d="M9 21v-8h6v8"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

// Create custom cluster icon
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let dimensions = 36;
  
  if (count >= 50) {
    size = 'large';
    dimensions = 48;
  } else if (count >= 10) {
    size = 'medium';
    dimensions = 42;
  }
  
  return L.divIcon({
    className: `mumu-cluster mumu-cluster-${size}`,
    html: `
      <div style="
        width: ${dimensions}px;
        height: ${dimensions}px;
        background: hsl(348, 45%, 32%);
        border: 3px solid hsl(40, 33%, 97%);
        border-radius: 50%;
        box-shadow: 0 3px 10px hsla(24, 10%, 18%, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-family: 'Source Sans 3', sans-serif;
        font-weight: 600;
        font-size: ${count >= 100 ? '12px' : '14px'};
        color: hsl(40, 33%, 97%);
      ">
        ${count}
      </div>
    `,
    iconSize: [dimensions, dimensions],
    iconAnchor: [dimensions / 2, dimensions / 2],
  });
};

export function MuseumMap({ museums, selectedMuseum, onSelectMuseum, userLocation, className = '' }: MuseumMapProps) {
  const { language } = useLanguage();
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);

  // Get Mapbox access token from env (optional)
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || null;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [39.8283, -98.5795], // Center of USA
      zoom: 4,
      zoomControl: false, // Disable default zoom control
    });

    // Add initial tile layer
    const tileConfig = getTileConfig(language, mapboxToken);
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || '',
      maxZoom: tileConfig.maxZoom || 19,
      tileSize: 512,
      zoomOffset: -1,
    }).addTo(mapRef.current);

    // Create marker cluster group
    clusterGroupRef.current = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15,
    });
    
    mapRef.current.addLayer(clusterGroupRef.current);
    
    // Mark map as ready
    setMapReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update tile layer when language changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    // Remove old tile layer
    mapRef.current.removeLayer(tileLayerRef.current);

    // Add new tile layer with updated language
    const tileConfig = getTileConfig(language, mapboxToken);
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || '',
      maxZoom: tileConfig.maxZoom || 19,
      tileSize: 512,
      zoomOffset: -1,
    }).addTo(mapRef.current);

    // Move tile layer to bottom (below markers)
    tileLayerRef.current.bringToBack();
  }, [language, mapboxToken]);

  // Add markers to cluster group
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    // Clear existing markers
    clusterGroupRef.current.clearLayers();
    markersRef.current.clear();

    museums.forEach((museum) => {
      const isAic = museum.has_full_content;
      const isSelected = selectedMuseum?.museum_id === museum.museum_id;
      const icon = isSelected ? createSelectedMarkerIcon(isAic) : createMarkerIcon(isAic);
      
      const marker = L.marker([museum.lat, museum.lng], { icon })
        .on('click', () => onSelectMuseum(museum));

      // Add tooltip with museum name
      marker.bindTooltip(museum.name, {
        direction: 'top',
        offset: [0, -14],
        className: 'mumu-tooltip',
      });

      clusterGroupRef.current!.addLayer(marker);
      markersRef.current.set(museum.museum_id, marker);
    });
  }, [museums, selectedMuseum, onSelectMuseum]);

  // Pan to selected museum
  useEffect(() => {
    if (!mapRef.current || !selectedMuseum) return;
    
    mapRef.current.setView([selectedMuseum.lat, selectedMuseum.lng], 12, {
      animate: true,
      duration: 0.5,
    });
  }, [selectedMuseum]);

  const handleZoomToLocation = () => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.setView([userLocation.latitude, userLocation.longitude], 10, {
      animate: true,
      duration: 0.5,
    });
  };

  const handleZoomToGlobal = () => {
    if (!mapRef.current) return;
    // Fit to world bounds showing all continents
    const worldBounds = L.latLngBounds(
      L.latLng(-60, -180), // Southwest corner (avoiding Antarctica)
      L.latLng(75, 180)    // Northeast corner
    );
    mapRef.current.fitBounds(worldBounds, {
      animate: true,
      padding: [20, 20],
    });
  };

  const handleZoomIn = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomOut();
  };

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '300px' }}>
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Minimap - Top Right */}
      {mapReady && mapRef.current && (
        <div className="absolute top-4 right-4 z-[1000]">
          <MiniMap mainMap={mapRef.current} />
        </div>
      )}
      
      {/* Map Controls */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-[1000]">
        {/* Zoom Controls */}
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
        
        {/* Navigation Controls */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomToLocation}
          disabled={!userLocation}
          className="bg-background/95 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary"
          title="Zoom to my location"
        >
          <Locate className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomToGlobal}
          className="bg-background/95 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary"
          title="Show all museums"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
