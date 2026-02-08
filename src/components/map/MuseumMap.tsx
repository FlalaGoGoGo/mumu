import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.heat';
import { Locate, Globe, Plus, Minus, Layers, MapPin, Flame, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MiniMap } from './MiniMap';
import type { Museum } from '@/types/museum';

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

type MapLayerMode = 'pins' | 'heatmap';

interface MuseumMapProps {
  museums: Museum[];
  selectedMuseum: Museum | null;
  onSelectMuseum: (museum: Museum) => void;
  userLocation?: { latitude: number; longitude: number; accuracy?: number | null } | null;
  locationFilter?: { country: string | null; state: string | null; city: string | null } | null;
  className?: string;
}

// Create user location marker icon
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

// SVG paths for category icons (matching filter chips)
const categoryIconSvgs: Record<string, string> = {
  // Palette icon for Art
  art: `<circle cx="13.5" cy="6.5" r=".5" fill="white"/><circle cx="17.5" cy="10.5" r=".5" fill="white"/><circle cx="8.5" cy="7.5" r=".5" fill="white"/><circle cx="6.5" cy="12.5" r=".5" fill="white"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" stroke="white" stroke-width="2" fill="none"/>`,
  // Scroll icon for History
  history: `<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M19 17V5a2 2 0 0 0-2-2H4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // Flask icon for Science
  science: `<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M8.5 2h7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M7 16h10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // Leaf icon for Nature
  nature: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  // Landmark icon for Temple
  temple: `<line x1="3" x2="21" y1="22" y2="22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="6" x2="6" y1="18" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" x2="10" y1="18" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="14" x2="14" y1="18" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="18" x2="18" y1="18" y2="11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polygon points="12 2 20 7 4 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="3" x2="21" y1="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  // Default building icon (fallback)
  default: `<path d="M3 21h18" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21V7l7-4 7 4v14" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21v-8h6v8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// Get category from museum tags
const getMuseumCategory = (tags: string | null): string => {
  if (!tags) return 'default';
  const tag = tags.toLowerCase();
  if (['art', 'history', 'science', 'nature', 'temple'].includes(tag)) {
    return tag;
  }
  return 'default';
};

// Create custom marker icons
const createMarkerIcon = (isAic: boolean, category: string) => {
  const color = isAic ? 'hsl(43, 60%, 45%)' : 'hsl(348, 45%, 32%)';
  const iconSvg = categoryIconSvgs[category] || categoryIconSvgs.default;
  
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          ${iconSvg}
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const createSelectedMarkerIcon = (isAic: boolean, category: string) => {
  const color = isAic ? 'hsl(43, 60%, 45%)' : 'hsl(348, 45%, 32%)';
  const iconSvg = categoryIconSvgs[category] || categoryIconSvgs.default;
  
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          ${iconSvg}
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

export function MuseumMap({ museums, selectedMuseum, onSelectMuseum, userLocation, locationFilter, className = '' }: MuseumMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [layerMode, setLayerMode] = useState<MapLayerMode>('pins');
  const prevLocationFilterRef = useRef<{ country: string | null; state: string | null; city: string | null } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [39.8283, -98.5795], // Center of USA
      zoom: 4,
      zoomControl: false, // Disable default zoom control
    });

    // Use a muted, elegant tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
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
        userMarkerRef.current = null;
        accuracyCircleRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const { latitude, longitude, accuracy } = userLocation;
    const latLng = L.latLng(latitude, longitude);

    // Create or update accuracy circle
    if (accuracy && accuracy < 5000) { // Only show if accuracy is reasonable
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(latLng);
        accuracyCircleRef.current.setRadius(accuracy);
      } else {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: accuracy,
          fillColor: 'hsl(43, 60%, 45%)',
          fillOpacity: 0.08,
          stroke: false,
        }).addTo(mapRef.current);
      }
    }

    // Create or update user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latLng);
    } else {
      userMarkerRef.current = L.marker(latLng, {
        icon: createUserLocationIcon(),
        zIndexOffset: -100, // Below museum markers
      }).addTo(mapRef.current);
    }
  }, [userLocation]);

  // Add markers / heatmap based on layer mode
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    // Clear all visualization layers
    clusterGroupRef.current.clearLayers();
    markersRef.current.clear();
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (layerMode === 'pins') {
      // Show cluster group layer
      if (!mapRef.current.hasLayer(clusterGroupRef.current)) {
        mapRef.current.addLayer(clusterGroupRef.current);
      }

      museums.forEach((museum) => {
        const isAic = museum.has_full_content;
        const isSelected = selectedMuseum?.museum_id === museum.museum_id;
        const category = getMuseumCategory(museum.tags);
        const icon = isSelected ? createSelectedMarkerIcon(isAic, category) : createMarkerIcon(isAic, category);
        
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
    } else {
      // Heatmap mode — hide cluster group, show heat layer
      if (mapRef.current.hasLayer(clusterGroupRef.current)) {
        mapRef.current.removeLayer(clusterGroupRef.current);
      }

      if (museums.length > 0) {
        const heatPoints: [number, number, number][] = museums.map(m => [
          m.lat,
          m.lng,
          m.highlight ? 1.5 : 1,
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
  }, [museums, selectedMuseum, onSelectMuseum, layerMode]);

  // Pan to selected museum
  useEffect(() => {
    if (!mapRef.current || !selectedMuseum) return;
    
    mapRef.current.setView([selectedMuseum.lat, selectedMuseum.lng], 12, {
      animate: true,
      duration: 0.5,
    });
  }, [selectedMuseum]);

  // Auto-zoom when location filter changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const prevFilter = prevLocationFilterRef.current;
    const currentFilter = locationFilter;
    
    // Check if filter actually changed (not just initial render)
    const hasChanged = 
      prevFilter?.country !== currentFilter?.country ||
      prevFilter?.state !== currentFilter?.state ||
      prevFilter?.city !== currentFilter?.city;
    
    // Update ref for next comparison
    prevLocationFilterRef.current = currentFilter ? { ...currentFilter } : null;
    
    // Skip if no change or this is the initial render with no filter
    if (!hasChanged || (prevFilter === null && !currentFilter?.country)) return;
    
    // If filter is cleared, reset to default world view
    if (!currentFilter?.country && !currentFilter?.state && !currentFilter?.city) {
      const worldBounds = L.latLngBounds(
        L.latLng(-60, -180),
        L.latLng(75, 180)
      );
      mapRef.current.flyToBounds(worldBounds, {
        padding: [20, 20],
        duration: 0.8,
      });
      return;
    }
    
    // If we have museums to show, fit bounds to them
    if (museums.length > 0) {
      if (museums.length === 1) {
        // Single museum: fly to it with reasonable zoom
        mapRef.current.flyTo([museums[0].lat, museums[0].lng], 8, {
          duration: 0.8,
        });
      } else {
        // Multiple museums: fit bounds
        const bounds = L.latLngBounds(
          museums.map(m => L.latLng(m.lat, m.lng))
        );
        mapRef.current.flyToBounds(bounds, {
          padding: [40, 40],
          maxZoom: 6,
          duration: 0.8,
        });
      }
    }
  }, [locationFilter?.country, locationFilter?.state, locationFilter?.city, museums, mapReady]);

  const handleZoomToLocation = () => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.setView([userLocation.latitude, userLocation.longitude], 10, {
      animate: true,
      duration: 0.5,
    });
  };

  const handleZoomToGlobal = () => {
    if (!mapRef.current) return;
    // Set a fixed world view that fills the map container well
    // Center on slight north of equator to better frame populated continents
    mapRef.current.setView([25, 0], 2, {
      animate: true,
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
        {/* Layers toggle */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/95 backdrop-blur-sm shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary"
              aria-label="Layers"
              title="Layers"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="left" align="start" className="w-40 p-1 z-[9999]">
            <button
              onClick={() => setLayerMode('pins')}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                layerMode === 'pins'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Pins</span>
              {layerMode === 'pins' && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
            <button
              onClick={() => setLayerMode('heatmap')}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                layerMode === 'heatmap'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Flame className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Heatmap</span>
              {layerMode === 'heatmap' && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          </PopoverContent>
        </Popover>

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
