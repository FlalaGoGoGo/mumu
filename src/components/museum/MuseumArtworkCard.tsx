 import { useState } from 'react';
 import { Volume2, Pause, Heart } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 import { getArtworkImageUrl, type EnrichedArtwork } from '@/types/art';
 import { useSpeechSynthesis, generateArtworkSpeechScript } from '@/hooks/useSpeechSynthesis';
 import { useCollectedArtworks } from '@/hooks/useCollectedArtworks';
 
 interface MuseumArtworkCardProps {
   artwork: EnrichedArtwork;
   movement?: string;
   onClick?: () => void;
 }
 
 export function MuseumArtworkCard({ artwork, movement, onClick }: MuseumArtworkCardProps) {
   const imageUrl = getArtworkImageUrl(artwork);
   const { speak, stop, isSpeaking, toggle, isSupported } = useSpeechSynthesis();
   const { isCollected, toggleCollect } = useCollectedArtworks();
   const [isPlaying, setIsPlaying] = useState(false);
   
   const collected = isCollected(artwork.artwork_id);
 
   const handleListen = (e: React.MouseEvent) => {
     e.stopPropagation();
     
     if (isPlaying) {
       stop();
       setIsPlaying(false);
       return;
     }
     
     const script = generateArtworkSpeechScript({
       title: artwork.title,
       artist_name: artwork.artist_name,
       year: artwork.year,
       movement,
       highlight: artwork.highlight,
     });
     
     speak(script);
     setIsPlaying(true);
     
     // Reset state when speech ends
     setTimeout(() => setIsPlaying(false), 10000);
   };
 
   const handleSaveClick = (e: React.MouseEvent) => {
     e.stopPropagation();
     toggleCollect(artwork);
   };
 
   return (
     <div
       onClick={onClick}
       className="group relative overflow-hidden rounded-lg border border-border bg-card cursor-pointer hover:border-primary/30 transition-colors"
     >
       {/* Image */}
       <div className="aspect-square bg-muted">
         {imageUrl ? (
           <img
             src={imageUrl}
             alt={artwork.title}
             className="w-full h-full object-cover"
           />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
             No image
           </div>
         )}
       </div>
 
       {/* Hover Overlay */}
       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="absolute bottom-0 left-0 right-0 p-3">
           <h4 className="font-medium text-white text-sm line-clamp-1">
             {artwork.title}
           </h4>
           <p className="text-white/70 text-xs line-clamp-1 mt-0.5">
             {artwork.artist_name}
           </p>
           <p className="text-white/50 text-xs mt-0.5">
             {artwork.year}
           </p>
         </div>
       </div>
 
       {/* Highlight Badge */}
       {artwork.highlight && (
         <div className="absolute top-2 left-2 px-2 py-0.5 bg-accent text-accent-foreground text-xs font-medium rounded">
           Must-see
         </div>
       )}
 
       {/* Action Buttons */}
       <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
         <Button
           size="icon"
           variant="secondary"
           className="h-7 w-7"
           onClick={handleSaveClick}
         >
          <Heart className={cn("h-3.5 w-3.5", collected && "fill-current text-destructive")} />
         </Button>
         {isSupported && (
           <Button
             size="icon"
             variant={isPlaying ? 'default' : 'secondary'}
             className="h-7 w-7"
             onClick={handleListen}
           >
             {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
           </Button>
         )}
       </div>
     </div>
   );
 }