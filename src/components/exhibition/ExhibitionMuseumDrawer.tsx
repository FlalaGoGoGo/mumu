import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/lib/i18n';
import { ExhibitionCompactCard } from './ExhibitionCompactCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Exhibition } from '@/types/exhibition';
import type { Museum } from '@/types/museum';

interface MuseumExhibitionGroup {
  museum: Museum;
  exhibitions: Exhibition[];
}

interface ExhibitionMuseumDrawerProps {
  group: MuseumExhibitionGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onExhibitionClick: (exhibition: Exhibition) => void;
}

export function ExhibitionMuseumDrawer({
  group,
  isOpen,
  onClose,
  onExhibitionClick,
}: ExhibitionMuseumDrawerProps) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  if (!isOpen || !group) return null;

  const { museum, exhibitions } = group;

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
              <h2 className="font-display text-lg font-semibold text-foreground">{museum.name}</h2>
              <p className="text-xs text-muted-foreground">
                {exhibitions.length} exhibition{exhibitions.length > 1 ? 's' : ''}
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
            {exhibitions.map(ex => (
              <ExhibitionCompactCard
                key={ex.exhibition_id}
                exhibition={ex}
                onClick={() => onExhibitionClick(ex)}
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
            <h2 className="font-display text-lg font-bold text-foreground leading-tight">{museum.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {exhibitions.length} exhibition{exhibitions.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exhibition list */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {exhibitions.map(ex => (
              <ExhibitionCompactCard
                key={ex.exhibition_id}
                exhibition={ex}
                onClick={() => onExhibitionClick(ex)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
