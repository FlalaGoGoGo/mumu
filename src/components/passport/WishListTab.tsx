import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Image as ImageIcon,
  Calendar,
  CheckCircle,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Museum } from '@/types/museum';
import type { SavedMuseum } from '@/hooks/useSavedMuseums';

interface WishListTabProps {
  savedMuseums: SavedMuseum[];
  onRemoveMuseum: (museumId: string) => void;
}

export function WishListTab({ savedMuseums, onRemoveMuseum }: WishListTabProps) {
  const navigate = useNavigate();
  const [showCompleted, setShowCompleted] = useState(false);

  if (savedMuseums.length === 0) {
    return (
      <div className="gallery-card text-center py-10">
        <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm mb-4">
          Your wish list is empty. Save museums, exhibitions, and artworks you'd like to visit!
        </p>
        <Button onClick={() => navigate('/')} size="sm">
          <MapPin className="w-4 h-4 mr-1.5" />
          Explore Museums
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Museums wish list */}
      <div>
        <h4 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Museums I Want to Visit
        </h4>
        <div className="grid gap-2.5 md:grid-cols-2">
          {savedMuseums.map((saved) => (
            <div
              key={saved.museum_id}
              className="gallery-card flex items-center gap-3 group"
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-muted border border-border">
                {saved.image_url ? (
                  <img
                    src={saved.image_url}
                    alt={saved.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm leading-tight whitespace-normal break-words">
                  {saved.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {saved.city}
                  {saved.state ? `, ${saved.state}` : ''}
                </p>
                {saved.website_url && (
                  <a
                    href={saved.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-0.5"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Website
                  </a>
                )}
              </div>

              {/* Heart remove */}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 flex-shrink-0"
                onClick={() => onRemoveMuseum(saved.museum_id)}
              >
                <Heart className="w-4 h-4 fill-current" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for exhibitions + artworks wish list (future) */}
      <div className="gallery-card py-6 text-center opacity-60">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Exhibition &amp; Artwork wish lists coming soon</span>
          <ImageIcon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
