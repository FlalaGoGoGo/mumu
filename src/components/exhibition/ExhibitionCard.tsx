import { useState } from 'react';
import { ExternalLink, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';

interface ExhibitionCardProps {
  exhibition: Exhibition;
  distance?: string | null;
}

const statusColors: Record<ExhibitionStatus, string> = {
  Ongoing: 'bg-green-50 text-green-700 border-green-200',
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  Past: 'bg-red-50 text-red-700 border-red-200',
  TBD: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function ExhibitionCard({ exhibition, distance }: ExhibitionCardProps) {
  const [imageError, setImageError] = useState(false);

  const location = [exhibition.city, exhibition.state].filter(Boolean).join(', ');

  return (
    <Card className="overflow-hidden flex flex-col h-full bg-card border border-border rounded-sm shadow-[0_1px_3px_hsl(var(--foreground)/0.04)] transition-shadow duration-200 hover:shadow-[0_4px_12px_hsl(var(--foreground)/0.08)]">
      {/* Cover Image - fixed 16:9 aspect ratio, flush to edges */}
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
        {!imageError && exhibition.cover_image_url ? (
          <img
            src={exhibition.cover_image_url}
            alt={exhibition.exhibition_name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-10 h-10 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <CardContent className="p-3 flex flex-col flex-1">
        {/* Header with status - right aligned */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-display text-base font-semibold text-foreground leading-tight line-clamp-2">
            {exhibition.exhibition_name}
          </h3>
          <Badge
            variant="outline"
            className={`flex-shrink-0 text-[10px] px-1.5 py-0 h-5 ${statusColors[exhibition.status]}`}
          >
            {exhibition.status}
          </Badge>
        </div>

        {/* Museum name with distance on right */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs text-muted-foreground truncate">{exhibition.museum_name}</span>
          {distance !== undefined && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {distance ?? '--'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1.5">{location}</p>

        {/* Date Label */}
        <p className="text-sm font-medium text-foreground mb-3">{exhibition.date_label}</p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions - only Official Page button */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a
            href={exhibition.official_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Official Page
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}