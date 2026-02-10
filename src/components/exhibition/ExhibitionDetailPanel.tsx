import { useEffect, useCallback } from 'react';
import { X, ExternalLink, ImageOff, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { RelatedArtworksGallery } from '@/components/exhibition/RelatedArtworksGallery';
import { ExhibitionArtworksMap } from '@/components/exhibition/ExhibitionArtworksMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';
import type { EnrichedArtwork } from '@/types/art';

interface ExhibitionDetailPanelProps {
  exhibition: Exhibition | null;
  open: boolean;
  onClose: () => void;
  onArtworkClick: (artwork: EnrichedArtwork) => void;
  museumWebsiteUrl?: string | null;
}

const statusColors: Record<ExhibitionStatus, string> = {
  Ongoing: 'bg-green-50 text-green-700 border-green-200',
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  Past: 'bg-red-50 text-red-700 border-red-200',
  TBD: 'bg-amber-50 text-amber-700 border-amber-200',
};

function formatDateRange(start: Date | null, end: Date | null): string {
  const fmt = (d: Date) => format(d, 'MMM d, yyyy');
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  if (end) return `Until ${fmt(end)}`;
  return 'Dates TBD';
}

export function ExhibitionDetailPanel({
  exhibition,
  open,
  onClose,
  onArtworkClick,
  museumWebsiteUrl,
}: ExhibitionDetailPanelProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  // ESC handler — only fires when no artwork panel is open (parent manages this)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        onClose();
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open || !exhibition) return null;

  const location = [exhibition.city, exhibition.state].filter(Boolean).join(', ');
  const linkUrl = exhibition.official_url || museumWebsiteUrl || null;

  const getStatusLabel = (status: ExhibitionStatus): string => {
    switch (status) {
      case 'Ongoing': return t('exhibitions.ongoing');
      case 'Upcoming': return t('exhibitions.upcoming');
      case 'Past': return t('exhibitions.past');
      case 'TBD': return t('exhibitions.tbd');
      default: return status;
    }
  };

  // Mobile: full-screen panel
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9100] bg-background flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-base font-semibold text-foreground truncate flex-1">
            {exhibition.exhibition_name}
          </h2>
        </div>

        <ScrollArea className="flex-1">
          <ExhibitionPanelContent
            exhibition={exhibition}
            location={location}
            linkUrl={linkUrl}
            statusColors={statusColors}
            getStatusLabel={getStatusLabel}
            onArtworkClick={onArtworkClick}
            t={t}
          />
        </ScrollArea>
      </div>
    );
  }

  // Desktop: left-side panel ~33% width, no dark overlay
  return (
    <div
      className="fixed top-0 left-0 bottom-0 z-[9100] w-[33vw] min-w-[360px] max-w-[480px] bg-background border-r border-border shadow-[4px_0_24px_hsl(var(--foreground)/0.08)] flex flex-col animate-in slide-in-from-left duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border flex-shrink-0">
        <h2 className="font-display text-lg font-bold text-foreground leading-tight truncate flex-1">
          Exhibition
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <ExhibitionPanelContent
          exhibition={exhibition}
          location={location}
          linkUrl={linkUrl}
          statusColors={statusColors}
          getStatusLabel={getStatusLabel}
          onArtworkClick={onArtworkClick}
          t={t}
        />
      </ScrollArea>
    </div>
  );
}

/* ── Shared content section ── */
function ExhibitionPanelContent({
  exhibition,
  location,
  linkUrl,
  statusColors,
  getStatusLabel,
  onArtworkClick,
  t,
}: {
  exhibition: Exhibition;
  location: string;
  linkUrl: string | null;
  statusColors: Record<ExhibitionStatus, string>;
  getStatusLabel: (s: ExhibitionStatus) => string;
  onArtworkClick: (artwork: EnrichedArtwork) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col">
      {/* Hero image */}
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
        {exhibition.cover_image_url ? (
          <img
            src={exhibition.cover_image_url}
            alt={exhibition.exhibition_name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold text-foreground leading-tight">
            {exhibition.exhibition_name}
          </h3>
          <Badge
            variant="outline"
            className={`flex-shrink-0 text-xs px-2 py-0.5 ${statusColors[exhibition.status]}`}
          >
            {getStatusLabel(exhibition.status)}
          </Badge>
        </div>

        {/* Key info */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{exhibition.museum_name}</p>
          {location && (
            <p className="text-sm text-muted-foreground">{location}</p>
          )}
          <p className="text-sm font-medium text-foreground mt-2">
            {formatDateRange(exhibition.start_date, exhibition.end_date)}
          </p>
        </div>

        {/* Description */}
        {exhibition.short_description && (
          <div className="space-y-1.5">
            <h4 className="font-display text-sm font-semibold text-foreground tracking-wide uppercase">
              About
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {exhibition.short_description}
            </p>
          </div>
        )}

        {/* Related Artworks */}
        {exhibition.related_artwork_ids.length > 0 && (
          <RelatedArtworksGallery
            artworkIds={exhibition.related_artwork_ids}
            onArtworkClick={onArtworkClick}
          />
        )}

        {/* Artworks on Map */}
        {exhibition.related_artwork_ids.length > 0 && (
          <ExhibitionArtworksMap
            artworkIds={exhibition.related_artwork_ids}
            venueMuseumId={exhibition.museum_id}
            venueMuseumName={exhibition.museum_name}
          />
        )}

        {/* Action */}
        {linkUrl && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('exhibitions.officialPage')}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
