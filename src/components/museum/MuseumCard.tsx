import { ExternalLink, Clock, MapPin, Star, Navigation, Heart } from 'lucide-react';
import type { Museum } from '@/types/museum';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isOpenToday } from '@/lib/parseOpeningHours';
import { useSavedMuseums } from '@/hooks/useSavedMuseums';
import { cn } from '@/lib/utils';

interface MuseumCardProps {
  museum: Museum;
  isVisited?: boolean;
  onMarkVisited?: () => void;
  onViewPlan?: () => void;
  compact?: boolean;
  stateCode?: string | null;
  distance?: string | null;
  showSaveButton?: boolean;
}

export function MuseumCard({ museum, isVisited, onMarkVisited, onViewPlan, compact = false, stateCode, distance, showSaveButton = true }: MuseumCardProps) {
  const { isSaved, toggleSave } = useSavedMuseums();
  const saved = isSaved(museum.museum_id);

  // Build location string: "City, STATE, Country" for US or "City, Country" for others
  const locationParts = [museum.city];
  if (stateCode) {
    locationParts.push(stateCode);
  }
  locationParts.push(museum.country);
  const locationString = locationParts.join(', ');

  // Determine open/closed status
  const isOpen = isOpenToday(museum.opening_hours);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave(museum);
  };

  if (compact) {
    return (
      <div className="gallery-card cursor-pointer hover:border-primary/30 transition-colors">
        <div className="flex items-start gap-3">
          {museum.hero_image_url && (
            <img 
              src={museum.hero_image_url} 
              alt={museum.name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-foreground leading-snug">
                {museum.name}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {showSaveButton && (
                  <button
                    onClick={handleSaveClick}
                    className={cn(
                      "p-1 rounded-full transition-colors",
                      saved 
                        ? "text-red-500 hover:text-red-600" 
                        : "text-muted-foreground hover:text-red-500"
                    )}
                    aria-label={saved ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={cn("w-4 h-4", saved && "fill-current")} />
                  </button>
                )}
                {museum.opening_hours && (
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 h-5 whitespace-nowrap ${
                      isOpen 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {isOpen ? 'Open Today' : 'Closed Today'}
                  </Badge>
                )}
                {museum.has_full_content && (
                  <span className="museum-chip whitespace-nowrap">Full Guide</span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {locationString}
            </p>
            {distance && (
              <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                <Navigation className="w-3 h-3" />
                {distance}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-card fade-in">
      {/* Hero Image */}
      {museum.hero_image_url && (
        <div className="mb-4 flex justify-center">
          <img 
            src={museum.hero_image_url} 
            alt={museum.name}
            className="w-24 h-24 object-cover rounded-lg shadow-sm"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="font-display text-xl font-semibold text-foreground leading-tight truncate">
              {museum.name}
            </h2>
            {showSaveButton && (
              <button
                onClick={handleSaveClick}
                className={cn(
                  "p-1.5 rounded-full transition-colors flex-shrink-0",
                  saved 
                    ? "text-red-500 hover:text-red-600" 
                    : "text-muted-foreground hover:text-red-500"
                )}
                aria-label={saved ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={cn("w-5 h-5", saved && "fill-current")} />
              </button>
            )}
            {museum.opening_hours && (
              <Badge 
                variant="outline" 
                className={`flex-shrink-0 text-[10px] px-1.5 py-0 h-5 ${
                  isOpen 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {isOpen ? 'Open Today' : 'Closed Today'}
              </Badge>
            )}
          </div>
          {museum.has_full_content && (
            <span className="museum-chip flex-shrink-0">Full Guide</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4" />
          <span>{locationString}</span>
        </div>
        {distance && (
          <div className="flex items-center gap-1 text-muted-foreground/70 text-xs mt-1">
            <Navigation className="w-3 h-3" />
            <span>{distance} away</span>
          </div>
        )}
      </div>

      {/* Address */}
      {museum.address && (
        <p className="text-sm text-muted-foreground mb-3">
          {museum.address}
        </p>
      )}

      {/* Opening Hours */}
      {museum.opening_hours && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-muted/50 rounded-sm">
          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-foreground">Hours: </span>
            <span className="text-muted-foreground">{museum.opening_hours}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto pt-2">
        {museum.has_full_content && onViewPlan && (
          <Button onClick={onViewPlan} className="w-full" variant="default">
            <Star className="w-4 h-4 mr-2" />
            View Highlights & Plan
          </Button>
        )}
        
        <div className="flex gap-2">
          {museum.website_url && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              asChild
            >
              <a href={museum.website_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Website
              </a>
            </Button>
          )}
          
          {onMarkVisited && (
            <Button 
              variant={isVisited ? "secondary" : "outline"}
              size="sm"
              className="flex-1"
              onClick={onMarkVisited}
            >
              {isVisited ? '✓ Visited' : 'Mark Visited'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
