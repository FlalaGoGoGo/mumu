import { EnrichedArtwork, getArtworkImageUrl } from '@/types/art';
import { useLanguage } from '@/lib/i18n';
import { useCollectedArtworks } from '@/hooks/useCollectedArtworks';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Navigation, Eye, EyeOff, User, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArtworkDetailSheetProps {
  artwork: EnrichedArtwork | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArtistClick?: (artistId: string) => void;
}

export function ArtworkDetailSheet({ 
  artwork, 
  open, 
  onOpenChange,
  onArtistClick 
}: ArtworkDetailSheetProps) {
  const { t } = useLanguage();
  const { isCollected, toggleCollect } = useCollectedArtworks();

  if (!artwork) return null;

  const collected = isCollected(artwork.artwork_id);

  const handleCollectToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCollect({
      artwork_id: artwork.artwork_id,
      title: artwork.title,
      artist_name: artwork.artist_name,
      year: artwork.year,
      image_url: getArtworkImageUrl(artwork),
      museum_name: artwork.museum_name,
    });
  };

  const handleNavigate = () => {
    // Try museum name first, fallback to coordinates
    const query = artwork.museum_name 
      ? encodeURIComponent(artwork.museum_name)
      : `${artwork.museum_lat},${artwork.museum_lng}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="sr-only">
          <SheetTitle>{artwork.title}</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-2rem)] pr-4">
          <div className="space-y-6 pb-8">
            {/* Image */}
            {getArtworkImageUrl(artwork) && (
              <div className="overflow-hidden rounded-lg border border-border">
                <img
                  src={getArtworkImageUrl(artwork)!}
                  alt={artwork.title}
                  className="w-full object-contain"
                />
              </div>
            )}

            {/* Title & Artist */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {artwork.title}
              </h2>
              <button
                onClick={() => {
                  onArtistClick?.(artwork.artist_id);
                  onOpenChange(false);
                }}
                className="mt-1 flex items-center gap-1.5 text-base text-primary hover:underline"
              >
                <User className="h-4 w-4" />
                {artwork.artist_name}
              </button>
              {artwork.year && (
                <p className="mt-1 text-sm text-muted-foreground">{artwork.year}</p>
              )}
            </div>

            {/* Badges + Collect Button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {artwork.art_type}
                </Badge>
                <Badge 
                  variant={artwork.on_view ? "default" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {artwork.on_view ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {artwork.on_view ? t('art.onView') : t('art.notOnView')}
                </Badge>
              </div>
              
              {/* Collect/Favorite Button */}
              <button
                onClick={handleCollectToggle}
                className={cn(
                  "p-2 rounded-full transition-colors flex-shrink-0",
                  collected 
                    ? "text-primary bg-primary/10 hover:bg-primary/20" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                aria-label={collected ? "Remove from collection" : "Add to collection"}
              >
                <Heart className={cn("w-5 h-5", collected && "fill-current")} />
              </button>
            </div>

            {/* Description */}
            {artwork.description && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('art.description')}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {artwork.description}
                </p>
              </div>
            )}

            {/* Medium & Dimensions */}
            <div className="grid gap-4 sm:grid-cols-2">
              {artwork.medium && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('art.medium')}
                  </h3>
                  <p className="text-sm text-foreground">{artwork.medium}</p>
                </div>
              )}
              {artwork.dimensions && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('art.dimensions')}
                  </h3>
                  <p className="text-sm text-foreground">{artwork.dimensions}</p>
                </div>
              )}
            </div>

            {/* Museum */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('art.museum')}
              </h3>
              <p className="font-medium text-foreground">{artwork.museum_name}</p>
              {artwork.museum_address && (
                <p className="text-sm text-muted-foreground">{artwork.museum_address}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {artwork.museum_page_url && (
                <Button variant="outline" asChild>
                  <a href={artwork.museum_page_url} target="_blank" rel="noopener noreferrer">
                    {t('art.viewOnMuseumSite')}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={handleNavigate}>
                {t('art.navigate')}
                <Navigation className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
