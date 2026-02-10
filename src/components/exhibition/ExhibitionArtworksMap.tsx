import { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapPin, Plus, Minus, Globe, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useArtworksRaw, useArtists, useMuseumsForArt } from '@/hooks/useArtworks';
import { getArtworkImageUrl } from '@/types/art';
import type { EnrichedArtwork } from '@/types/art';

interface MuseumGroup {
  museum_id: string;
  museum_name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  artworks: { title: string; imageUrl: string | null }[];
}

interface ExhibitionArtworksMapProps {
  artworkIds: string[];
  /** The museum hosting the exhibition */
  venueMuseumId?: string;
  venueMuseumName?: string;
  className?: string;
}

const createMuseumIcon = (count: number) =>
  L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div style="position:relative;">
        <div style="width:28px;height:28px;background:hsl(348,45%,32%);border:2px solid hsl(40,33%,97%);border-radius:50%;box-shadow:0 2px 8px hsla(24,10%,18%,0.25);display:flex;align-items:center;justify-content:center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" stroke-width="2" fill="none"/>
            <path d="M3 9h18M9 3v18" stroke="white" stroke-width="2"/>
          </svg>
        </div>
        ${count > 1 ? `<div style="position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 4px;background:hsl(43,60%,45%);border:2px solid hsl(40,33%,97%);border-radius:9px;font-family:'Source Sans 3',sans-serif;font-size:10px;font-weight:700;color:hsl(40,33%,97%);display:flex;align-items:center;justify-content:center;">${count}</div>` : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const createVenueIcon = () =>
  L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div style="width:32px;height:32px;background:hsl(43,60%,45%);border:2px solid hsl(40,33%,97%);border-radius:50%;box-shadow:0 2px 8px hsla(24,10%,18%,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="white" stroke-width="2" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  const dim = count >= 10 ? 42 : 36;
  return L.divIcon({
    className: `mumu-cluster`,
    html: `<div style="width:${dim}px;height:${dim}px;background:hsl(348,45%,32%);border:3px solid hsl(40,33%,97%);border-radius:50%;box-shadow:0 3px 10px hsla(24,10%,18%,0.3);display:flex;align-items:center;justify-content:center;font-family:'Source Sans 3',sans-serif;font-weight:600;font-size:14px;color:hsl(40,33%,97%);">${count}</div>`,
    iconSize: [dim, dim],
    iconAnchor: [dim / 2, dim / 2],
  });
};

export function ExhibitionArtworksMap({
  artworkIds,
  venueMuseumId,
  venueMuseumName,
  className = '',
}: ExhibitionArtworksMapProps) {
  const { data: artworks } = useArtworksRaw();
  const { data: artists } = useArtists();
  const { data: museums } = useMuseumsForArt();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const venueMarkerRef = useRef<L.Marker | null>(null);
  const [showVenue, setShowVenue] = useState(true);

  // Group artworks by source museum
  const { museumGroups, venueMuseum } = useMemo(() => {
    if (!artworks || !museums || artworkIds.length === 0)
      return { museumGroups: [] as MuseumGroup[], venueMuseum: null as MuseumGroup | null };

    const museumById = new Map(museums.map((m) => [m.museum_id, m]));
    const groups = new Map<string, MuseumGroup>();

    for (const id of artworkIds) {
      const artwork = artworks.find((a) => a.artwork_id === id);
      if (!artwork) continue;
      const museum = museumById.get(artwork.museum_id);
      if (!museum || !museum.lat || !museum.lng) continue;

      const existing = groups.get(artwork.museum_id);
      const entry = { title: artwork.title, imageUrl: getArtworkImageUrl(artwork) };
      if (existing) {
        existing.artworks.push(entry);
      } else {
        groups.set(artwork.museum_id, {
          museum_id: artwork.museum_id,
          museum_name: museum.name,
          city: museum.city,
          country: museum.country,
          lat: museum.lat,
          lng: museum.lng,
          artworks: [entry],
        });
      }
    }

    const venue = venueMuseumId ? (groups.get(venueMuseumId) ?? null) : null;
    return { museumGroups: Array.from(groups.values()), venueMuseum: venue ? { ...venue } : null };
  }, [artworks, museums, artworkIds, venueMuseumId]);

  const hasMappableMuseums = museumGroups.length > 0;

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !hasMappableMuseums) return;

    mapRef.current = L.map(containerRef.current, {
      center: [25, 0],
      zoom: 2,
      zoomControl: false,
      scrollWheelZoom: false,
    });

    // Enable scroll zoom on click
    mapRef.current.on('click', () => mapRef.current?.scrollWheelZoom.enable());
    mapRef.current.on('mouseout', () => mapRef.current?.scrollWheelZoom.disable());

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapRef.current);

    clusterRef.current = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 40,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 14,
    });
    mapRef.current.addLayer(clusterRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      venueMarkerRef.current = null;
    };
  }, [hasMappableMuseums]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !clusterRef.current) return;
    clusterRef.current.clearLayers();

    const allLatLngs: L.LatLng[] = [];

    museumGroups.forEach((group) => {
      const isVenue = group.museum_id === venueMuseumId;
      if (isVenue) return; // venue handled separately

      const icon = createMuseumIcon(group.artworks.length);
      const marker = L.marker([group.lat, group.lng], { icon });

      const artList = group.artworks
        .slice(0, 4)
        .map((a) => `<li style="font-size:12px;color:hsl(24,8%,45%);">• ${a.title}</li>`)
        .join('');
      const moreText = group.artworks.length > 4 ? `<p style="font-size:11px;color:hsl(24,8%,55%);margin-top:4px;">+${group.artworks.length - 4} more</p>` : '';

      marker.bindPopup(
        `<div style="font-family:'Source Sans 3',sans-serif;min-width:160px;">
          <div style="font-family:'Cormorant Garamond',serif;font-weight:700;font-size:14px;color:hsl(24,10%,18%);margin-bottom:2px;">${group.museum_name}</div>
          <div style="font-size:12px;color:hsl(24,8%,45%);margin-bottom:6px;">${group.city}, ${group.country}</div>
          <div style="font-size:12px;font-weight:600;color:hsl(24,10%,18%);margin-bottom:4px;">${group.artworks.length} artwork${group.artworks.length > 1 ? 's' : ''} contributed</div>
          <ul style="margin:0;padding:0;list-style:none;">${artList}</ul>
          ${moreText}
        </div>`,
        { closeButton: true, className: 'mumu-popup', maxWidth: 240 }
      );

      marker.bindTooltip(group.museum_name, { direction: 'top', offset: [0, -14], className: 'mumu-tooltip' });
      clusterRef.current!.addLayer(marker);
      allLatLngs.push(L.latLng(group.lat, group.lng));
    });

    // Venue marker (separate, not clustered)
    if (venueMarkerRef.current) {
      mapRef.current.removeLayer(venueMarkerRef.current);
      venueMarkerRef.current = null;
    }

    const venueGroup = museumGroups.find((g) => g.museum_id === venueMuseumId);
    if (venueGroup && showVenue) {
      venueMarkerRef.current = L.marker([venueGroup.lat, venueGroup.lng], {
        icon: createVenueIcon(),
        zIndexOffset: 100,
      })
        .bindPopup(
          `<div style="font-family:'Source Sans 3',sans-serif;min-width:160px;">
            <div style="font-family:'Cormorant Garamond',serif;font-weight:700;font-size:14px;color:hsl(24,10%,18%);margin-bottom:2px;">★ Venue</div>
            <div style="font-size:13px;font-weight:600;color:hsl(24,10%,18%);">${venueGroup.museum_name}</div>
            <div style="font-size:12px;color:hsl(24,8%,45%);">${venueGroup.city}, ${venueGroup.country}</div>
            ${venueGroup.artworks.length > 0 ? `<div style="font-size:12px;color:hsl(24,8%,45%);margin-top:4px;">${venueGroup.artworks.length} artwork${venueGroup.artworks.length > 1 ? 's' : ''} from own collection</div>` : ''}
          </div>`,
          { closeButton: true, className: 'mumu-popup', maxWidth: 240 }
        )
        .bindTooltip(`★ ${venueGroup.museum_name} (Venue)`, { direction: 'top', offset: [0, -16], className: 'mumu-tooltip' })
        .addTo(mapRef.current);
      allLatLngs.push(L.latLng(venueGroup.lat, venueGroup.lng));
    }

    // Fit bounds
    if (allLatLngs.length > 1) {
      mapRef.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [30, 30], maxZoom: 8 });
    } else if (allLatLngs.length === 1) {
      mapRef.current.setView(allLatLngs[0], 6, { animate: true });
    }
  }, [museumGroups, venueMuseumId, showVenue]);

  // No data at all
  if (!artworkIds.length) return null;

  // Loading state
  if (!artworks || !museums) return null;

  // No mappable museums
  if (!hasMappableMuseums) {
    return (
      <div className="space-y-1.5">
        <h3 className="font-display text-sm font-semibold text-foreground tracking-wide uppercase">
          Artworks on Map
        </h3>
        <p className="text-xs text-muted-foreground">
          Location data unavailable for these related artworks.
        </p>
      </div>
    );
  }

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleGlobe = () => {
    if (!mapRef.current) return;
    const allLatLngs = museumGroups.map((g) => L.latLng(g.lat, g.lng));
    if (allLatLngs.length > 1) {
      mapRef.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [30, 30], maxZoom: 8, animate: true });
    } else if (allLatLngs.length === 1) {
      mapRef.current.setView(allLatLngs[0], 6, { animate: true });
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <h3 className="font-display text-sm font-semibold text-foreground tracking-wide uppercase">
        Artworks on Map
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Museums that contributed artworks to this exhibition.
      </p>

      <div className="relative w-full rounded-lg overflow-hidden border border-border" style={{ height: 'clamp(240px, 30vw, 340px)' }}>
        <div ref={containerRef} className="w-full h-full" />

        {/* Venue toggle – top-right overlay */}
        {venueMuseumId && (
          <div className="absolute top-3 right-3 z-[1000]">
            <button
              onClick={() => setShowVenue((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md border border-border bg-background/95 backdrop-blur-sm shadow-md"
              title={showVenue ? 'Hide venue' : 'Show venue'}
            >
              {showVenue ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Venue
            </button>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-[1000]">
          <div className="flex flex-col rounded-md overflow-hidden shadow-md">
            <Button variant="outline" size="icon" onClick={handleZoomIn} className="bg-background/95 backdrop-blur-sm rounded-none rounded-t-md border-b-0 h-7 w-7 hover:bg-primary hover:text-primary-foreground" title="Zoom in">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut} className="bg-background/95 backdrop-blur-sm rounded-none rounded-b-md h-7 w-7 hover:bg-primary hover:text-primary-foreground" title="Zoom out">
              <Minus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={handleGlobe} className="bg-background/95 backdrop-blur-sm shadow-md h-7 w-7 hover:bg-primary hover:text-primary-foreground" title="Fit all">
            <Globe className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
