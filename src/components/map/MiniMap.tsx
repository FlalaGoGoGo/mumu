import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useLanguage } from '@/lib/i18n';

interface MiniMapProps {
  mainMap: L.Map;
}

export function MiniMap({ mainMap }: MiniMapProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);
  const viewportRectRef = useRef<L.Rectangle | null>(null);

  useEffect(() => {
    if (!containerRef.current || miniMapRef.current) return;

    // Create minimap with world view - centered to show all continents
    const miniMap = L.map(containerRef.current, {
      center: [20, 0], // Slightly north of equator for better continental view
      zoom: 0,
      minZoom: 0,
      maxZoom: 2,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });

    // Add tile layer with muted styling
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(miniMap);

    // Create viewport rectangle
    const bounds = mainMap.getBounds();
    const viewportRect = L.rectangle(bounds, {
      color: 'hsl(348, 45%, 32%)',
      weight: 2,
      fillColor: 'hsl(348, 45%, 32%)',
      fillOpacity: 0.2,
      interactive: false,
    }).addTo(miniMap);

    miniMapRef.current = miniMap;
    viewportRectRef.current = viewportRect;

    // Update viewport rectangle when main map moves
    const updateViewport = () => {
      if (viewportRectRef.current) {
        const newBounds = mainMap.getBounds();
        viewportRectRef.current.setBounds(newBounds);
      }
    };

    mainMap.on('move', updateViewport);
    mainMap.on('zoom', updateViewport);
    mainMap.on('moveend', updateViewport);
    mainMap.on('zoomend', updateViewport);

    // Click on minimap to recenter main map
    miniMap.on('click', (e: L.LeafletMouseEvent) => {
      mainMap.setView(e.latlng, mainMap.getZoom(), {
        animate: true,
        duration: 0.3,
      });
    });

    // Initial update
    updateViewport();

    return () => {
      mainMap.off('move', updateViewport);
      mainMap.off('zoom', updateViewport);
      mainMap.off('moveend', updateViewport);
      mainMap.off('zoomend', updateViewport);
      
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
    };
  }, [mainMap]);

  return (
    <div className="minimap-container relative">
      {/* Title label */}
      <div 
        className="absolute top-2 left-2.5 z-[1001] text-xs font-medium text-foreground/60 pointer-events-none select-none"
        style={{
          textShadow: '0 1px 2px hsl(var(--background))',
        }}
      >
        {t('map.worldOverview')}
      </div>
      
      {/* Map container */}
      <div 
        ref={containerRef}
        className="w-[180px] h-[110px] rounded-lg overflow-hidden cursor-pointer"
        style={{
          border: '2px solid hsl(43, 60%, 45%)',
          boxShadow: '0 4px 12px hsla(24, 10%, 18%, 0.15)',
          background: 'hsl(39, 33%, 96%)',
        }}
        title={t('map.worldOverview')}
      />
    </div>
  );
}
