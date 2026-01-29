import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Locate, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function MuseumMap({ museums, selectedMuseum, onSelectMuseum, userLocation, className = '' }: MuseumMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [39.8283, -98.5795], // Center of USA
      zoom: 4,
      zoomControl: true,
    });

    // Use a muted, elegant tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    museums.forEach((museum) => {
      const isAic = museum.has_full_content;
      const isSelected = selectedMuseum?.museum_id === museum.museum_id;
      const icon = isSelected ? createSelectedMarkerIcon(isAic) : createMarkerIcon(isAic);
      
      const marker = L.marker([museum.lat, museum.lng], { icon })
        .addTo(mapRef.current!)
        .on('click', () => onSelectMuseum(museum));

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
    mapRef.current.setView([39.8283, -98.5795], 4, {
      animate: true,
      duration: 0.5,
    });
  };

  return (
    <div className={`relative w-full h-full ${className}`} style={{ minHeight: '300px' }}>
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Map Controls */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-[1000]">
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
