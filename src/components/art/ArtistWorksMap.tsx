 import { useEffect, useRef, useState, useMemo } from 'react';
 import L from 'leaflet';
 import 'leaflet/dist/leaflet.css';
 import 'leaflet.markercluster';
 import 'leaflet.markercluster/dist/MarkerCluster.css';
 import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
 import 'leaflet.heat';
 import { useNavigate } from 'react-router-dom';
 import { useLanguage } from '@/lib/i18n';
 import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { MapPin, Flame, ExternalLink } from 'lucide-react';
 import type { EnrichedArtwork } from '@/types/art';
 
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
 
 interface MuseumGroup {
   museumId: string;
   museumName: string;
   lat: number;
   lng: number;
   city?: string;
   state?: string;
   country?: string;
   artworks: EnrichedArtwork[];
 }
 
 interface ArtistWorksMapProps {
   artworks: EnrichedArtwork[];
   artistName: string;
 }
 
 type ViewMode = 'pins' | 'heat';
 
 // Create cluster icon matching the app style
 const createClusterIcon = (cluster: L.MarkerCluster) => {
   const count = cluster.getChildCount();
   let dimensions = 36;
   
   if (count >= 10) {
     dimensions = 42;
   } else if (count >= 5) {
     dimensions = 38;
   }
   
   return L.divIcon({
     className: 'artist-works-cluster',
     html: `
       <div style="
         width: ${dimensions}px;
         height: ${dimensions}px;
         background: hsl(348, 45%, 32%);
         border: 2px solid hsl(40, 33%, 97%);
         border-radius: 50%;
         box-shadow: 0 2px 8px hsla(24, 10%, 18%, 0.25);
         display: flex;
         align-items: center;
         justify-content: center;
         font-family: 'Source Sans 3', sans-serif;
         font-weight: 600;
         font-size: 13px;
         color: hsl(40, 33%, 97%);
       ">
         ${count}
       </div>
     `,
     iconSize: [dimensions, dimensions],
     iconAnchor: [dimensions / 2, dimensions / 2],
   });
 };
 
 // Create museum marker with artwork count badge
 const createMuseumMarkerIcon = (artworkCount: number) => {
   const showBadge = artworkCount > 1;
   
   return L.divIcon({
     className: 'museum-artwork-marker',
     html: `
       <div style="
         position: relative;
         width: 28px;
         height: 28px;
         background: hsl(348, 45%, 32%);
         border: 2px solid hsl(40, 33%, 97%);
         border-radius: 50%;
         box-shadow: 0 2px 8px hsla(24, 10%, 18%, 0.25);
         display: flex;
         align-items: center;
         justify-content: center;
       ">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
           <circle cx="13.5" cy="6.5" r=".5" fill="white"/>
           <circle cx="17.5" cy="10.5" r=".5" fill="white"/>
           <circle cx="8.5" cy="7.5" r=".5" fill="white"/>
           <circle cx="6.5" cy="12.5" r=".5" fill="white"/>
           <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>
         </svg>
         ${showBadge ? `
           <div style="
             position: absolute;
             top: -6px;
             right: -6px;
             min-width: 18px;
             height: 18px;
             padding: 0 4px;
             background: hsl(43, 60%, 45%);
             border: 2px solid hsl(40, 33%, 97%);
             border-radius: 9px;
             font-family: 'Source Sans 3', sans-serif;
             font-size: 10px;
             font-weight: 600;
             color: hsl(40, 33%, 97%);
             display: flex;
             align-items: center;
             justify-content: center;
           ">${artworkCount}</div>
         ` : ''}
       </div>
     `,
     iconSize: [28, 28],
     iconAnchor: [14, 14],
     popupAnchor: [0, -14],
   });
 };
 
 export function ArtistWorksMap({ artworks, artistName }: ArtistWorksMapProps) {
   const { t } = useLanguage();
   const navigate = useNavigate();
   const containerRef = useRef<HTMLDivElement>(null);
   const mapRef = useRef<L.Map | null>(null);
   const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
   const heatLayerRef = useRef<L.Layer | null>(null);
   const [viewMode, setViewMode] = useState<ViewMode>('pins');
 
   // Group artworks by museum
   const museumGroups = useMemo(() => {
     const groups = new Map<string, MuseumGroup>();
     
     for (const artwork of artworks) {
       // Skip if no valid coordinates
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
       center: [39.8283, -98.5795],
       zoom: 4,
       zoomControl: true,
       scrollWheelZoom: true,
     });
 
     L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
       attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
       subdomains: 'abcd',
       maxZoom: 19,
     }).addTo(mapRef.current);
 
     // Create cluster group
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
         clusterGroupRef.current = null;
         heatLayerRef.current = null;
       }
     };
   }, []);
 
   // Update markers and heatmap when data or view mode changes
   useEffect(() => {
     if (!mapRef.current || !clusterGroupRef.current) return;
 
     // Clear existing layers
     clusterGroupRef.current.clearLayers();
     if (heatLayerRef.current) {
       mapRef.current.removeLayer(heatLayerRef.current);
       heatLayerRef.current = null;
     }
 
     if (museumGroups.length === 0) return;
 
     // Fit bounds to all museum points
     const bounds = L.latLngBounds(museumGroups.map(g => [g.lat, g.lng]));
     mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
 
     if (viewMode === 'pins') {
       // Add clustered markers
       museumGroups.forEach((group) => {
         const marker = L.marker([group.lat, group.lng], {
           icon: createMuseumMarkerIcon(group.artworks.length),
         });
 
         // Create tooltip
         const tooltipContent = `${group.museumName} · ${group.artworks.length} ${t('art.artworks')}`;
         marker.bindTooltip(tooltipContent, {
           direction: 'top',
           offset: [0, -14],
           className: 'mumu-tooltip',
         });
 
         // Create popup with artwork thumbnails
         const artworksHtml = group.artworks.slice(0, 3).map(artwork => {
           const imgUrl = artwork.image_cached_url || artwork.image_url;
           return imgUrl ? `
             <div style="width: 48px; height: 48px; background: #f5f5f5; border-radius: 4px; overflow: hidden;">
               <img src="${imgUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
             </div>
           ` : '';
         }).join('');
 
         const popupContent = `
           <div style="min-width: 180px; font-family: 'Source Sans 3', sans-serif;">
             <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${group.museumName}</div>
             <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${group.artworks.length} ${t('art.artworks')}</div>
             <div style="display: flex; gap: 4px; margin-bottom: 8px;">${artworksHtml}</div>
             <button 
               onclick="window.__openMuseum('${group.museumId}')" 
               style="
                 width: 100%;
                 padding: 6px 12px;
                 background: hsl(348, 45%, 32%);
                 color: white;
                 border: none;
                 border-radius: 4px;
                 font-size: 12px;
                 cursor: pointer;
               "
             >${t('art.openMuseum')}</button>
           </div>
         `;
 
         marker.bindPopup(popupContent);
         clusterGroupRef.current!.addLayer(marker);
       });
     } else {
       // Create heat layer
       const heatPoints: [number, number, number][] = museumGroups.map(g => [
         g.lat,
         g.lng,
         g.artworks.length, // weight = number of artworks
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
   }, [museumGroups, viewMode, t]);
 
   // Global function for popup button
   useEffect(() => {
     (window as unknown as { __openMuseum: (id: string) => void }).__openMuseum = (museumId: string) => {
       navigate(`/museum/${museumId}`);
     };
 
     return () => {
       delete (window as unknown as { __openMuseum?: (id: string) => void }).__openMuseum;
     };
   }, [navigate]);
 
   if (museumGroups.length === 0) {
     return (
       <Card className="mt-8">
         <CardHeader className="pb-2">
           <CardTitle className="text-base font-medium">{t('art.worksOnMap')}</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex h-[260px] items-center justify-center text-muted-foreground">
             {t('art.noLocationData')}
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="mt-8">
       <CardHeader className="flex flex-row items-center justify-between pb-2">
         <CardTitle className="text-base font-medium">
           {t('art.worksOnMap')}
         </CardTitle>
         <ToggleGroup
           type="single"
           value={viewMode}
           onValueChange={(value) => value && setViewMode(value as ViewMode)}
           size="sm"
           className="gap-0.5"
         >
           <ToggleGroupItem value="pins" aria-label={t('art.viewPins')} className="gap-1.5 px-2.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
             <MapPin className="h-3.5 w-3.5" />
             {t('art.viewPins')}
           </ToggleGroupItem>
           <ToggleGroupItem value="heat" aria-label={t('art.viewHeat')} className="gap-1.5 px-2.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
             <Flame className="h-3.5 w-3.5" />
             {t('art.viewHeat')}
           </ToggleGroupItem>
         </ToggleGroup>
       </CardHeader>
       <CardContent className="p-0">
         <div 
           ref={containerRef} 
           className="h-[320px] min-h-[260px] w-full rounded-b-lg"
         />
       </CardContent>
     </Card>
   );
 }