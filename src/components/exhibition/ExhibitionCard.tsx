import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, MapPin, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';

interface ExhibitionCardProps {
  exhibition: Exhibition;
}

const statusColors: Record<ExhibitionStatus, string> = {
  Ongoing: 'bg-green-50 text-green-700 border-green-200',
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  Past: 'bg-muted text-muted-foreground border-border',
  TBD: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function ExhibitionCard({ exhibition }: ExhibitionCardProps) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleViewMuseum = () => {
    navigate(`/?museum=${exhibition.museum_id}`);
  };

  const location = [exhibition.city, exhibition.state].filter(Boolean).join(', ');

  return (
    <Card className="gallery-card overflow-hidden flex flex-col h-full">
      {/* Cover Image */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {!imageError && exhibition.cover_image_url ? (
          <img
            src={exhibition.cover_image_url}
            alt={exhibition.exhibition_name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        {/* Header with status */}
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

        {/* Museum & Location */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{exhibition.museum_name}</span>
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
            <MapPin className="w-4 h-4 mr-2" />
            View Museum
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
