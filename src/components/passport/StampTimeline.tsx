import { useNavigate } from 'react-router-dom';
import { MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Museum, UserVisit } from '@/types/museum';
import { cn } from '@/lib/utils';

interface StampTimelineProps {
  visits: UserVisit[];
  museumMap: Map<string, Museum>;
  artworkCountByMuseum: Map<string, number>;
  onRemoveVisit: (museumId: string) => void;
}

export function StampTimeline({
  visits,
  museumMap,
  artworkCountByMuseum,
  onRemoveVisit,
}: StampTimelineProps) {
  const navigate = useNavigate();

  if (visits.length === 0) {
    return (
      <div className="gallery-card text-center py-10">
        <div className="passport-stamp mx-auto mb-4 w-20 h-20">
          <span className="text-[10px]">NO STAMPS</span>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          No museums visited yet. Start exploring!
        </p>
        <Button onClick={() => navigate('/')} size="sm">
          <MapPin className="w-4 h-4 mr-1.5" />
          Discover Museums
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visits.map((visit, i) => {
        const museum = museumMap.get(visit.museum_id);
        if (!museum) return null;

        const artCount = artworkCountByMuseum.get(museum.museum_id) || 0;
        const rotation = ((i * 7 + 3) % 11) - 5; // -5 to 5 degrees

        return (
          <div
            key={visit.id}
            className="passport-stamp-card group relative gallery-card border-2 border-[hsl(var(--gold-border)/0.4)] hover:border-[hsl(var(--gold-border)/0.7)] transition-all overflow-hidden"
            style={{ '--stamp-rotation': `${rotation}deg` } as React.CSSProperties}
          >
            {/* Stamp badge */}
            <div className="absolute -top-1 -right-1 w-14 h-14 opacity-[0.08]">
              <div
                className="w-full h-full rounded-full border-[3px] border-dashed border-primary"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            </div>

            <div className="flex items-center gap-3.5">
              {/* Stamp image */}
              <div className="w-14 h-14 rounded-full border-2 border-[hsl(var(--gold-border)/0.4)] flex-shrink-0 overflow-hidden bg-muted">
                {museum.hero_image_url ? (
                  <img
                    src={museum.hero_image_url}
                    alt={museum.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <MapPin className="w-5 h-5 text-primary/40" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground leading-tight whitespace-normal break-words">
                  {museum.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {museum.city}, {museum.country}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                    {new Date(visit.visited_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {artCount > 0 && (
                    <span className="text-[11px] text-accent font-medium">
                      {artCount} artwork{artCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={() => onRemoveVisit(museum.museum_id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
