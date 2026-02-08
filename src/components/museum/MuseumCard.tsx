import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ExternalLink, Clock, MapPin, Star, Navigation, Heart, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
  const navigate = useNavigate();
  const { isSaved, toggleSave } = useSavedMuseums();
  const saved = isSaved(museum.museum_id);
  const [addressCopied, setAddressCopied] = useState(false);

  const handleViewPlan = () => {
    navigate(`/museum/${museum.museum_id}`);
  };

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!museum.address) return;
    
    try {
      await navigator.clipboard.writeText(museum.address);
      setAddressCopied(true);
      toast({
        title: "Address copied",
        description: "The address has been copied to your clipboard.",
      });
      setTimeout(() => setAddressCopied(false), 1500);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy address to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Build location string: "City, State, Country" with graceful fallbacks
  const buildLocationString = () => {
    const parts: string[] = [];
    if (museum.city) parts.push(museum.city);
    if (stateCode) parts.push(stateCode);
    if (museum.country) parts.push(museum.country);
    return parts.length > 0 ? parts.join(', ') : 'Location unavailable';
  };
  const locationString = buildLocationString();

  // Determine open/closed/unknown status
  const hasHours = !!museum.opening_hours;
  const isOpen = hasHours ? isOpenToday(museum.opening_hours) : null;

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave(museum);
  };

  if (compact) {
    return (
      <div className="gallery-card cursor-pointer hover:border-primary/30 transition-colors relative overflow-hidden">
        {/* Corner Ribbon Status */}
        <div 
          className={cn(
            "absolute top-0 right-0 text-[9px] font-medium px-4 py-0.5",
            "origin-center rotate-0",
            "rounded-bl-md",
            isOpen === true
              ? 'bg-green-100 text-green-700' 
              : isOpen === false
                ? 'bg-red-100 text-red-700'
                : 'bg-muted text-muted-foreground'
          )}
        >
          {isOpen === true ? 'Open' : isOpen === false ? 'Closed' : 'Hours N/A'}
        </div>

        <div className="flex gap-3">
          {/* Hero Image */}
          {museum.hero_image_url && (
            <img 
              src={museum.hero_image_url} 
              alt={museum.name}
              className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            />
          )}
          
          {/* Left Column: Info */}
          <div className="min-w-0 flex-1 pr-8">
            {/* Title - 2 line clamp */}
            <h3 className="font-display text-base font-semibold text-foreground leading-snug line-clamp-2">
              {museum.name}
            </h3>
            
            {/* Location - unified style */}
            <p className="text-xs text-muted-foreground/70 mt-1">
              {locationString}
            </p>
            
            {/* Distance - unified style */}
            {distance && (
              <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                <Navigation className="w-3 h-3" />
                {distance}
              </p>
            )}
          </div>
          
          {/* Right Column: Heart - positioned below ribbon area */}
          {showSaveButton && (
            <div className="flex flex-col items-end pt-5 flex-shrink-0">
              <button
                onClick={handleSaveClick}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  saved 
                    ? "text-red-500 hover:text-red-600" 
                    : "text-muted-foreground hover:text-red-500"
                )}
                aria-label={saved ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={cn("w-4 h-4", saved && "fill-current")} />
              </button>
            </div>
          )}
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

      {/* Header Row: Name + Heart + Badge */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="font-display text-xl font-semibold text-foreground leading-tight flex-1 min-w-0">
          {museum.name}
        </h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showSaveButton && (
            <button
              onClick={handleSaveClick}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                saved 
                  ? "text-red-500 hover:text-red-600" 
                  : "text-muted-foreground hover:text-red-500"
              )}
              aria-label={saved ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={cn("w-5 h-5", saved && "fill-current")} />
            </button>
          )}
          {(
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] px-2 py-0.5 h-5 whitespace-nowrap",
                isOpen === true
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : isOpen === false
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-muted/50 text-muted-foreground border-border'
              )}
            >
              {isOpen === true ? 'Open Today' : isOpen === false ? 'Closed Today' : 'Hours N/A'}
            </Badge>
          )}
        </div>
      </div>

      {/* Location Meta */}
      <div className="mb-4 space-y-0.5">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{locationString}</span>
        </div>
        {distance && (
          <div className="flex items-center gap-1.5 text-muted-foreground/70 text-sm pl-0.5">
            <Navigation className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{distance} away</span>
          </div>
        )}
      </div>

      {museum.has_full_content && (
        <div className="mb-4">
          <span className="museum-chip">Full Guide</span>
        </div>
      )}

      {/* Info Bars */}
      <div className="space-y-2 mb-4">
        {/* Hours Bar */}
        {museum.opening_hours && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md min-h-[48px]">
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="text-sm flex-1">
              <span className="font-medium text-foreground">Hours: </span>
              <span className="text-muted-foreground">{museum.opening_hours}</span>
            </div>
          </div>
        )}

        {/* Address Bar with Copy */}
        {museum.address && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md min-h-[48px]">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="text-sm flex-1 min-w-0">
              <span className="font-medium text-foreground">Address: </span>
              <span className="text-muted-foreground break-words">{museum.address}</span>
            </div>
            <button
              onClick={handleCopyAddress}
              className="p-2 rounded-md hover:bg-muted transition-colors flex-shrink-0 -mr-1"
              aria-label="Copy address to clipboard"
            >
              {addressCopied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {museum.has_full_content && (
          <Button onClick={handleViewPlan} className="w-full" variant="default">
            <Star className="w-4 h-4 mr-2" />
            View Highlights & Plan
          </Button>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          {museum.website_url && (
            <Button 
              variant="outline" 
              size="default"
              className="w-full"
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
              variant={isVisited ? "secondary" : "default"}
              size="default"
              className="w-full"
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
