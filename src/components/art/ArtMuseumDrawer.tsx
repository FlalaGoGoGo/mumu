import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/lib/i18n';
import { ArtGalleryTile } from './ArtGalleryTile';
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
  /** Filtered artworks to show (subset of group.artworks that pass current filters) */
  filteredArtworkIds?: Set<string>;
}

export function ArtMuseumDrawer({
  group,
  isOpen,
  onClose,
  onArtworkClick,
  filteredArtworkIds,
}: ArtMuseumDrawerProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  if (!isOpen || !group) return null;

  const { museumName, artworks: allArtworks } = group;
  const artworks = filteredArtworkIds
    ? allArtworks.filter(a => filteredArtworkIds.has(a.artwork_id))
    : allArtworks;

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 bg-foreground/20 z-[9000]"
          onClick={onClose}
        />
        <div className="fixed left-0 right-0 bottom-0 z-[9100] bottom-sheet slide-up" style={{ maxHeight: '70vh' }}>
          <div className="flex flex-col items-center pt-2 pb-1">
            <div className="bottom-sheet-handle" />
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">{museumName}</h2>
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
          <div className="overflow-y-auto px-3 py-3" style={{ maxHeight: 'calc(70vh - 80px)' }}>
            {artworks.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {artworks.map(artwork => (
                  <ArtGalleryTile
                    key={artwork.artwork_id}
                    artwork={artwork}
                    onClick={() => onArtworkClick(artwork)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                {t('art.noResults')}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Desktop: in-map panel rendered by ArtMuseumPanel inside ArtMapView
  return null;
}

/**
 * Desktop in-map panel — rendered inside the map container.
 * Absolutely positioned, LEFT-aligned, full height of map.
 */
interface ArtMuseumPanelProps {
  group: ArtMuseumGroup;
  onClose: () => void;
  onArtworkClick: (artwork: EnrichedArtwork) => void;
  filteredArtworkIds?: Set<string>;
}

export function ArtMuseumPanel({
  group,
  onClose,
  onArtworkClick,
  filteredArtworkIds,
}: ArtMuseumPanelProps) {
  const { t } = useLanguage();
  const { museumName, artworks: allArtworks } = group;
  const artworks = filteredArtworkIds
    ? allArtworks.filter(a => filteredArtworkIds.has(a.artwork_id))
    : allArtworks;

  return (
    <div className="absolute top-0 left-0 bottom-0 w-[320px] z-[1100] bg-background/95 backdrop-blur-sm border-r border-border shadow-lg flex flex-col fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-3 py-2.5 border-b border-border flex-shrink-0">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold text-foreground leading-tight truncate">{museumName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {artworks.length} {t('art.artworks')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 rounded-sm hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mini Gallery Grid */}
      <ScrollArea className="flex-1">
        {artworks.length > 0 ? (
          <div className="p-2 grid grid-cols-3 gap-1.5">
            {artworks.map(artwork => (
              <ArtGalleryTile
                key={artwork.artwork_id}
                artwork={artwork}
                onClick={() => onArtworkClick(artwork)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {t('art.noResults')}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
