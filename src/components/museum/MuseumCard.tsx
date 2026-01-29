import { ExternalLink, Clock, MapPin, Star } from 'lucide-react';
import type { Museum } from '@/types/museum';
import { Button } from '@/components/ui/button';

interface MuseumCardProps {
  museum: Museum;
  isVisited?: boolean;
  onMarkVisited?: () => void;
  onViewPlan?: () => void;
  compact?: boolean;
}

export function MuseumCard({ museum, isVisited, onMarkVisited, onViewPlan, compact = false }: MuseumCardProps) {
  if (compact) {
    return (
      <div className="gallery-card cursor-pointer hover:border-primary/30 transition-colors">
        <div className="flex items-start gap-3">
          {museum.hero_image_url && (
            <img 
              src={museum.hero_image_url} 
              alt={museum.name}
              className="w-12 h-12 rounded-sm object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-base font-semibold text-foreground truncate">
              {museum.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {museum.city}, {museum.country}
            </p>
          </div>
          {museum.has_full_content && (
            <span className="museum-chip flex-shrink-0">Full Guide</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-card fade-in">
      {/* Hero Image */}
      {museum.hero_image_url && (
        <div className="mb-4 -mx-4 -mt-4">
          <img 
            src={museum.hero_image_url} 
            alt={museum.name}
            className="w-full h-32 object-cover rounded-t-sm"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="font-display text-xl font-semibold text-foreground leading-tight">
            {museum.name}
          </h2>
          {museum.has_full_content && (
            <span className="museum-chip flex-shrink-0">Full Guide</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4" />
          <span>{museum.city}, {museum.country}</span>
        </div>
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
