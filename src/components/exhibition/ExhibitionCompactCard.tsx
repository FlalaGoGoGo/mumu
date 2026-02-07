import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';

interface ExhibitionCompactCardProps {
  exhibition: Exhibition;
  onClick?: () => void;
}

const statusGlassColors: Record<ExhibitionStatus, string> = {
  Ongoing: 'text-green-700 dark:text-green-300',
  Upcoming: 'text-blue-700 dark:text-blue-300',
  Past: 'text-red-700 dark:text-red-300',
  TBD: 'text-amber-700 dark:text-amber-300',
};

export function ExhibitionCompactCard({ exhibition, onClick }: ExhibitionCompactCardProps) {
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
      {/* Cover Image - short banner 16:5 with status chip overlay */}
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

        {/* Glassmorphism status chip */}
        <span
          className={`absolute top-2 left-2 z-[2] inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-[10px] shadow-[0_6px_18px_rgba(0,0,0,0.12)] border border-white/35 bg-white/75 dark:bg-black/35 dark:border-white/20 ${statusGlassColors[exhibition.status]}`}
        >
          {getStatusLabel(exhibition.status)}
        </span>
      </div>

      <CardContent className="p-2.5 flex flex-col gap-0.5">
        {/* Title - max 2 lines */}
        <h3 className="font-display text-sm font-semibold text-foreground leading-snug line-clamp-2">
          {exhibition.exhibition_name}
        </h3>

        {/* Date range - 1 line with ellipsis */}
        <p className="text-xs text-muted-foreground truncate leading-tight">{exhibition.date_label}</p>
      </CardContent>
    </Card>
  );
}
