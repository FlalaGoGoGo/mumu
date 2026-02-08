import { MapPin, Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Museum } from '@/types/museum';
import type { MuseumStatus } from '@/hooks/usePassportData';

interface MuseumStampCardProps {
  museum: Museum;
  status: MuseumStatus;
  wishDate?: string;
  visitDate?: string;
  artworkCount: number;
  justStamped?: boolean;
  onStamp?: () => void;
  onAddWish?: () => void;
  onRemoveWish?: () => void;
  onRemoveVisit?: () => void;
}

function formatDate(date?: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function MuseumStampCard({
  museum, status, wishDate, visitDate, artworkCount,
  justStamped, onStamp, onAddWish, onRemoveWish, onRemoveVisit,
}: MuseumStampCardProps) {
  const rotation = ((museum.museum_id.charCodeAt(0) * 7 + 3) % 11) - 5;

  return (
    <div
      className={cn(
        'group relative gallery-card transition-all overflow-hidden',
        status === 'planned' && 'border-2 border-dashed border-[hsl(var(--gold-border)/0.3)] bg-card/50',
        status === 'visited' && 'passport-stamp-card border-2 border-[hsl(var(--gold-border)/0.4)] hover:border-[hsl(var(--gold-border)/0.7)]',
        status === 'completed' && 'passport-stamp-card border-2 border-[hsl(var(--gold-border)/0.6)] hover:border-[hsl(var(--gold-border)/0.9)]',
        justStamped && 'stamp-press'
      )}
      style={{ '--stamp-rotation': `${rotation}deg` } as React.CSSProperties}
    >
      {/* Stamp badge for visited/completed */}
      {(status === 'visited' || status === 'completed') && (
        <div className="absolute -top-1 -right-1 w-14 h-14 opacity-[0.08]">
          <div
            className="w-full h-full rounded-full border-[3px] border-dashed border-primary"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        </div>
      )}

      {/* Ghost stamp for planned */}
      {status === 'planned' && (
        <div className="absolute -top-1 -right-1 w-14 h-14 opacity-[0.04]">
          <div className="w-full h-full rounded-full border-[3px] border-dashed border-muted-foreground" />
        </div>
      )}

      <div className="flex items-center gap-3.5">
        {/* Museum image */}
        <div className={cn(
          'w-14 h-14 rounded-full flex-shrink-0 overflow-hidden bg-muted',
          status === 'planned'
            ? 'border-2 border-dashed border-[hsl(var(--gold-border)/0.2)]'
            : 'border-2 border-[hsl(var(--gold-border)/0.4)]',
        )}>
          {museum.hero_image_url ? (
            <img
              src={museum.hero_image_url}
              alt={museum.name}
              className={cn('w-full h-full object-cover', status === 'planned' && 'opacity-60')}
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

          {status === 'completed' && (
            <span className="text-[10px] font-display font-semibold text-accent uppercase tracking-wide">
              Wish → Visited ✦
            </span>
          )}

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {status === 'planned' && wishDate && (
              <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                Wished: {formatDate(wishDate)}
              </span>
            )}
            {(status === 'visited') && visitDate && (
              <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                {formatDate(visitDate)}
              </span>
            )}
            {status === 'completed' && (
              <>
                {visitDate && (
                  <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                    Visited: {formatDate(visitDate)}
                  </span>
                )}
                {wishDate && (
                  <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                    · Wished: {formatDate(wishDate)}
                  </span>
                )}
              </>
            )}
            {artworkCount > 0 && (
              <span className="text-[11px] text-accent font-medium">
                {artworkCount} artwork{artworkCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {status === 'planned' && onStamp && (
            <Button variant="default" size="sm" onClick={onStamp} className="text-xs gap-1">
              Stamp it
            </Button>
          )}
          {status === 'planned' && onRemoveWish && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
              onClick={onRemoveWish}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {status === 'visited' && (
            <>
              {onAddWish && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddWish}
                  className="text-muted-foreground/40 hover:text-accent h-7 w-7"
                  title="Add to Wish List"
                >
                  <Heart className="w-4 h-4" />
                </Button>
              )}
              {onRemoveVisit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  onClick={onRemoveVisit}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </>
          )}
          {status === 'completed' && (
            <div className="flex flex-col gap-0.5">
              {onRemoveWish && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  onClick={onRemoveWish}
                  title="Remove from Wish List"
                >
                  <Heart className="w-3 h-3 fill-current" />
                </Button>
              )}
              {onRemoveVisit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  onClick={onRemoveVisit}
                  title="Remove visit"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
