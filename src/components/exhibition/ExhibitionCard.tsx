import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';

interface ExhibitionCardProps {
  exhibition: Exhibition;
  distance?: string | null;
  onClick?: () => void;
  onImageError?: () => void;
}
const statusColors: Record<ExhibitionStatus, string> = {
  Ongoing: 'bg-green-50 text-green-700 border-green-200',
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  Past: 'bg-red-50 text-red-700 border-red-200',
  TBD: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function ExhibitionCard({ exhibition, distance, onClick, onImageError }: ExhibitionCardProps) {
  const [imageError, setImageError] = useState(false);
  const { t } = useLanguage();

  const location = [exhibition.city, exhibition.state].filter(Boolean).join(', ');

  const getStatusLabel = (status: ExhibitionStatus): string => {
    switch (status) {
      case 'Ongoing': return t('exhibitions.ongoing');
      case 'Upcoming': return t('exhibitions.upcoming');
      case 'Past': return t('exhibitions.past');
      case 'TBD': return t('exhibitions.tbd');
      default: return status;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Card
      className="overflow-hidden flex flex-col bg-card border border-border rounded-sm shadow-[0_1px_3px_hsl(var(--foreground)/0.04)] transition-shadow duration-200 hover:shadow-[0_4px_12px_hsl(var(--foreground)/0.08)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={exhibition.exhibition_name}
    >
      {/* Cover Image - fixed height */}
      <div className="relative w-full h-48 flex-shrink-0">
        {!imageError && exhibition.cover_image_url ? (
          <img
            src={exhibition.cover_image_url}
            alt={exhibition.exhibition_name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => { setImageError(true); onImageError?.(); }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-10 h-10 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <CardContent className="p-3 flex flex-col flex-1">
        {/* Header with status */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-display text-base font-semibold text-foreground leading-tight line-clamp-2">
            {exhibition.exhibition_name}
          </h3>
          <Badge
            variant="outline"
            className={`flex-shrink-0 text-[10px] px-1.5 py-0 h-5 ${statusColors[exhibition.status]}`}
          >
            {getStatusLabel(exhibition.status)}
          </Badge>
        </div>

        {/* Museum name with distance */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs text-muted-foreground truncate">{exhibition.museum_name}</span>
          {distance !== undefined && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {distance ?? '--'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">{location}</p>

        {/* Date Label */}
        <p className="text-sm font-medium text-foreground line-clamp-1">{exhibition.date_label}</p>
      </CardContent>
    </Card>
  );
}
