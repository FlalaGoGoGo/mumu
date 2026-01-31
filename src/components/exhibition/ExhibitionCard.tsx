import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Past: 'bg-muted text-muted-foreground border-border',
  TBD: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function ExhibitionCard({ exhibition, distance }: ExhibitionCardProps) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleViewMuseum = () => {
    navigate(`/?museum=${exhibition.museum_id}`);
  };

  const location = [exhibition.city, exhibition.state].filter(Boolean).join(', ');

  return (
    <Card className="overflow-hidden flex flex-col h-full bg-card border border-border rounded-sm shadow-[0_1px_3px_hsl(var(--foreground)/0.04)] transition-shadow duration-200 hover:shadow-[0_4px_12px_hsl(var(--foreground)/0.08)]">
      {/* Cover Image - flush to edges, no padding */}
      <div className="relative aspect-[16/9] bg-muted">
        {!imageError && exhibition.cover_image_url ? (
          <img
            src={exhibition.cover_image_url}
            alt={exhibition.exhibition_name}
            className="block w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <CardContent className="p-4 pt-4 flex flex-col flex-1">
        {/* Header with status - right aligned */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-lg font-semibold text-foreground leading-tight line-clamp-2">
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
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm text-muted-foreground truncate">{exhibition.museum_name}</span>
          {distance !== undefined && (
            <span className="text-sm text-muted-foreground flex-shrink-0">
              {distance ?? '--'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{location}</p>

        {/* Date Label */}
        <p className="text-sm font-medium text-foreground mb-4">{exhibition.date_label}</p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a
              href={exhibition.official_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Official Page
            </a>
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={handleViewMuseum}>
            View Museum
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
