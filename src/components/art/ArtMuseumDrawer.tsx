import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/lib/i18n';
import { ArtCompactCard } from './ArtCompactCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { EnrichedArtwork } from '@/types/art';

export interface ArtMuseumGroup {
  museumId: string;
  museumName: string;
  lat: number;
  lng: number;
  artworks: EnrichedArtwork[];
}

interface ArtMuseumDrawerProps {
  group: ArtMuseumGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onArtworkClick: (artwork: EnrichedArtwork) => void;
}

export function ArtMuseumDrawer({
  group,
  isOpen,
  onClose,
  onArtworkClick,
}: ArtMuseumDrawerProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  if (!isOpen || !group) return null;

  const { museumName, artworks } = group;

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-foreground/20 z-[9000]"
          onClick={onClose}
        />
        {/* Bottom Sheet */}
        <div className="fixed left-0 right-0 bottom-0 z-[9100] bottom-sheet slide-up" style={{ maxHeight: '70vh' }}>
          <div className="flex flex-col items-center pt-2 pb-1">
            <div className="bottom-sheet-handle" />
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">{museumName}</h2>
              <p className="text-xs text-muted-foreground">
                {artworks.length} {t('art.artworks')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-4 py-4 space-y-3" style={{ maxHeight: 'calc(70vh - 80px)' }}>
            {artworks.map(artwork => (
              <ArtCompactCard
                key={artwork.artwork_id}
                artwork={artwork}
                onClick={() => onArtworkClick(artwork)}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  // Desktop: Right-side drawer
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/10 z-[9000]"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-[380px] max-w-full z-[9100] bg-background border-l border-border shadow-lg flex flex-col fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-foreground leading-tight">{museumName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {artworks.length} {t('art.artworks')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Artwork list */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {artworks.map(artwork => (
              <ArtCompactCard
                key={artwork.artwork_id}
                artwork={artwork}
                onClick={() => onArtworkClick(artwork)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
