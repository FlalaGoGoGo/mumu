import { ExternalLink, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/lib/i18n';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';

interface ExhibitionDetailModalProps {
  exhibition: Exhibition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ExhibitionDetailModal({
  exhibition,
  open,
  onOpenChange,
  museumWebsiteUrl,
}: ExhibitionDetailModalProps) {
  const { t } = useLanguage();

  if (!exhibition) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg p-0 gap-0 overflow-hidden sm:rounded-lg max-h-[90vh] z-[9200]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <ScrollArea className="max-h-[90vh]">
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
            {/* Header */}
            <DialogHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <DialogTitle className="font-display text-xl font-bold text-foreground leading-tight">
                  {exhibition.exhibition_name}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`flex-shrink-0 text-xs px-2 py-0.5 ${statusColors[exhibition.status]}`}
                >
                  {getStatusLabel(exhibition.status)}
                </Badge>
              </div>
            </DialogHeader>

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
                <h3 className="font-display text-sm font-semibold text-foreground tracking-wide uppercase">
                  About
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {exhibition.short_description}
                </p>
              </div>
            )}

            {/* Action */}
            {linkUrl && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t('exhibitions.officialPage')}
                </a>
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
