 import { useState, useMemo } from 'react';
 import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
 import { Button } from '@/components/ui/button';
 import { Checkbox } from '@/components/ui/checkbox';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Play, Pause, MapPin, Volume2 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useSpeechSynthesis, generateArtworkSpeechScript } from '@/hooks/useSpeechSynthesis';
 import type { EnrichedArtwork } from '@/types/art';
 import { getArtworkImageUrl } from '@/types/art';
 
 type RouteTime = '30min' | '1hour' | '2hours' | 'full';
 
 const ROUTE_STOPS: Record<RouteTime, number> = {
   '30min': 4,
   '1hour': 8,
   '2hours': 12,
   'full': 20,
 };
 
 interface RoutePlannerDrawerProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   artworks: EnrichedArtwork[];
   artistMovements?: Map<string, string>;
 }
 
 export function RoutePlannerDrawer({
   open,
   onOpenChange,
   artworks,
   artistMovements = new Map(),
 }: RoutePlannerDrawerProps) {
   const [routeTime, setRouteTime] = useState<RouteTime>('1hour');
   const [seenArtworks, setSeenArtworks] = useState<Set<string>>(new Set());
   const [currentSpeakingId, setCurrentSpeakingId] = useState<string | null>(null);
   const [locatedArtwork, setLocatedArtwork] = useState<string | null>(null);
   
   const { speak, stop, isSpeaking, isPaused, toggle, isSupported } = useSpeechSynthesis();
 
   // Sort artworks: highlights first, then by title
   const sortedArtworks = useMemo(() => {
     return [...artworks].sort((a, b) => {
       if (a.highlight && !b.highlight) return -1;
       if (!a.highlight && b.highlight) return 1;
       return a.title.localeCompare(b.title);
     });
   }, [artworks]);
 
   // Get route stops based on selected time
   const routeStops = useMemo(() => {
     const maxStops = ROUTE_STOPS[routeTime];
     return sortedArtworks.slice(0, maxStops);
   }, [sortedArtworks, routeTime]);
 
   const seenCount = routeStops.filter(a => seenArtworks.has(a.artwork_id)).length;
   const progressPercent = routeStops.length > 0 ? (seenCount / routeStops.length) * 100 : 0;
 
   const handleToggleSeen = (artworkId: string) => {
     setSeenArtworks(prev => {
       const next = new Set(prev);
       if (next.has(artworkId)) {
         next.delete(artworkId);
       } else {
         next.add(artworkId);
       }
       return next;
     });
   };
 
   const handleListen = (artwork: EnrichedArtwork) => {
     if (currentSpeakingId === artwork.artwork_id && isSpeaking) {
       toggle();
       return;
     }
     
     stop();
     setCurrentSpeakingId(artwork.artwork_id);
     
     const movement = artistMovements.get(artwork.artist_id);
     const script = generateArtworkSpeechScript({
       title: artwork.title,
       artist_name: artwork.artist_name,
       year: artwork.year,
       movement,
       highlight: artwork.highlight,
     });
     
     speak(script);
   };
 
   const handleLocate = (artwork: EnrichedArtwork) => {
     setLocatedArtwork(artwork.artwork_id);
     // Auto-clear after 3 seconds
     setTimeout(() => setLocatedArtwork(null), 3000);
   };
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
         <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
           <SheetTitle className="font-display text-xl">Route Planner</SheetTitle>
           
           {/* Time Selector Pills */}
           <div className="flex gap-2 mt-4">
             {(['30min', '1hour', '2hours', 'full'] as RouteTime[]).map((time) => (
               <Button
                 key={time}
                 size="sm"
                 variant={routeTime === time ? 'default' : 'outline'}
                 onClick={() => setRouteTime(time)}
                 className="flex-1"
               >
                 {time === '30min' && '30 min'}
                 {time === '1hour' && '1 hour'}
                 {time === '2hours' && '2 hours'}
                 {time === 'full' && 'Full'}
               </Button>
             ))}
           </div>
 
           {/* Progress Bar */}
           <div className="mt-4">
             <div className="flex items-center justify-between text-sm mb-2">
               <span className="font-medium">Progress</span>
               <span className="text-muted-foreground">{seenCount}/{routeStops.length}</span>
             </div>
             <div className="h-2 bg-muted rounded-full overflow-hidden">
               <div 
                 className="h-full bg-accent transition-all duration-300"
                 style={{ width: `${progressPercent}%` }}
               />
             </div>
           </div>
         </SheetHeader>
 
         {/* Locate Section */}
         {locatedArtwork && (
           <div className="px-6 py-3 bg-accent/10 border-b border-border">
             <div className="flex items-center gap-2 text-sm">
               <MapPin className="w-4 h-4 text-accent" />
               <span className="font-medium">Location:</span>
               <span className="text-muted-foreground">
                 On view at The Art Institute of Chicago
               </span>
             </div>
           </div>
         )}
 
         {/* Mini Player */}
         {isSpeaking && currentSpeakingId && (
           <div className="px-6 py-3 bg-primary/5 border-b border-border">
             <div className="flex items-center gap-3">
               <Button
                 size="icon"
                 variant="outline"
                 className="h-8 w-8"
                 onClick={toggle}
               >
                 {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
               </Button>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium truncate">
                   {routeStops.find(a => a.artwork_id === currentSpeakingId)?.title || 'Playing...'}
                 </p>
                 <p className="text-xs text-muted-foreground">Audio guide</p>
               </div>
               <Button
                 size="sm"
                 variant="ghost"
                 onClick={stop}
               >
                 Stop
               </Button>
             </div>
           </div>
         )}
 
         {/* Route Stops */}
         <ScrollArea className="flex-1">
           <div className="px-6 py-4 space-y-3">
             {routeStops.length === 0 ? (
               <p className="text-center text-muted-foreground py-8">
                 No artworks available for this museum.
               </p>
             ) : (
               routeStops.map((artwork, index) => {
                 const imageUrl = getArtworkImageUrl(artwork);
                 const isSeen = seenArtworks.has(artwork.artwork_id);
                 const isCurrentlySpeaking = currentSpeakingId === artwork.artwork_id && isSpeaking;
                 const isLocated = locatedArtwork === artwork.artwork_id;
 
                 return (
                   <div
                     key={artwork.artwork_id}
                     className={cn(
                       "flex gap-3 p-3 rounded-lg border transition-colors",
                       isSeen ? "bg-muted/50 border-muted" : "border-border",
                       isLocated && "ring-2 ring-accent"
                     )}
                   >
                     {/* Checkbox */}
                     <div className="flex items-center">
                       <Checkbox
                         checked={isSeen}
                         onCheckedChange={() => handleToggleSeen(artwork.artwork_id)}
                         className="h-5 w-5"
                       />
                     </div>
 
                     {/* Thumbnail */}
                     <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                       {imageUrl ? (
                         <img
                           src={imageUrl}
                           alt={artwork.title}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                           No img
                         </div>
                       )}
                     </div>
 
                     {/* Info */}
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <span className="text-xs font-medium text-muted-foreground">
                           #{index + 1}
                         </span>
                         {artwork.highlight && (
                           <span className="text-xs px-1.5 py-0.5 bg-accent/20 text-accent rounded">
                             Must-see
                           </span>
                         )}
                       </div>
                       <h4 className={cn(
                         "font-medium text-sm line-clamp-1 mt-0.5",
                         isSeen && "line-through text-muted-foreground"
                       )}>
                         {artwork.title}
                       </h4>
                       <p className="text-xs text-muted-foreground line-clamp-1">
                         {artwork.artist_name} • {artwork.year}
                       </p>
                     </div>
 
                     {/* Actions */}
                     <div className="flex flex-col gap-1">
                       <Button
                         size="sm"
                         variant={isCurrentlySpeaking ? 'default' : 'outline'}
                         className="h-7 text-xs px-2"
                         onClick={() => handleListen(artwork)}
                         disabled={!isSupported}
                       >
                         <Volume2 className="h-3 w-3 mr-1" />
                         Listen
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         className="h-7 text-xs px-2"
                         onClick={() => handleLocate(artwork)}
                       >
                         <MapPin className="h-3 w-3 mr-1" />
                         Locate
                       </Button>
                     </div>
                   </div>
                 );
               })
             )}
           </div>
         </ScrollArea>
       </SheetContent>
     </Sheet>
   );
 }