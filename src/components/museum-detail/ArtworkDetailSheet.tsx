import { useState } from 'react';
import { ExternalLink, MapPin, MessageCircle, Plus, Star, X, Frame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { ArtworkRef } from '@/types/museumDetail';
import mumuLogo from '@/assets/mumu-logo.png';

interface ArtworkDetailSheetProps {
  artwork: ArtworkRef | null;
  open: boolean;
  onClose: () => void;
  onAskMuMu?: (question: string) => void;
}

export function ArtworkDetailSheet({ artwork, open, onClose, onAskMuMu }: ArtworkDetailSheetProps) {
  const [imgError, setImgError] = useState(false);

  if (!artwork) return null;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{artwork.title}</SheetTitle>
        </SheetHeader>

        {/* Image */}
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {artwork.imageUrl && !imgError ? (
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-full h-full object-contain bg-muted"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <img src={mumuLogo} alt="MuMu" className="w-10 h-10 opacity-30" />
              <span className="text-xs text-muted-foreground">Image unavailable</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{artwork.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {artwork.artistTitle}{artwork.year ? `, ${artwork.year}` : ''}
            </p>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            {artwork.isOnView ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">
                <MapPin className="w-3 h-3 mr-1" />
                On view · Gallery {artwork.galleryNumber}, Floor {artwork.floor}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-muted-foreground">
                <Frame className="w-3 h-3 mr-1" />
                Not currently on view
              </Badge>
            )}
            {artwork.mustSee && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                <Star className="w-3 h-3 mr-1" />
                Must-see
              </Badge>
            )}
          </div>

          {/* Description */}
          {artwork.shortDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {artwork.shortDescription}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {onAskMuMu && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  onAskMuMu(`Tell me the story behind ${artwork.title} by ${artwork.artistTitle}`);
                  onClose();
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Ask MuMu about this work
              </Button>
            )}

            {artwork.isOnView && artwork.galleryNumber && (
              <Button variant="outline" className="w-full justify-start gap-2" disabled>
                <Plus className="w-4 h-4" />
                Add to my route
                <span className="text-xs text-muted-foreground ml-auto">Coming soon</span>
              </Button>
            )}

            {artwork.museumPageUrl && (
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <a href={artwork.museumPageUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  View on museum site
                </a>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
