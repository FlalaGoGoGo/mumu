import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';

interface ExhibitionCompactCardProps {
  exhibition: Exhibition;
  distance?: string | null;
  onClick?: () => void;
}

const statusColors: Record<ExhibitionStatus, string> = {
  Ongoing: 'bg-green-50 text-green-700 border-green-200',
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  Past: 'bg-red-50 text-red-700 border-red-200',
  TBD: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function ExhibitionCompactCard({ exhibition, distance, onClick }: ExhibitionCompactCardProps) {
  const [imageError, setImageError] = useState(false);
  const { t } = useLanguage();

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
      {/* Cover Image - short banner 16:5 */}
      <div className="relative w-full flex-shrink-0" style={{ aspectRatio: '16 / 5' }}>
        {!imageError && exhibition.cover_image_url ? (
          <img
            src={exhibition.cover_image_url}
            alt={exhibition.exhibition_name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-8 h-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <CardContent className="p-2.5 flex flex-col gap-1">
        {/* Title - max 2 lines */}
        <h3 className="font-display text-sm font-semibold text-foreground leading-snug line-clamp-2">
          {exhibition.exhibition_name}
        </h3>

        {/* Status chip + distance inline */}
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={`flex-shrink-0 text-[10px] px-1.5 py-0 h-[18px] ${statusColors[exhibition.status]}`}
          >
            {getStatusLabel(exhibition.status)}
          </Badge>
          {distance !== undefined && distance !== null && (
            <span className="text-[11px] text-muted-foreground flex-shrink-0">{distance}</span>
          )}
        </div>

        {/* Date range - 1 line with ellipsis */}
        <p className="text-xs text-muted-foreground truncate leading-tight">{exhibition.date_label}</p>
      </CardContent>
    </Card>
  );
}
