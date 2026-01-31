import { Star, MapPin, Flag, Palette } from 'lucide-react';
import type { PassportStats } from '@/lib/achievements';
import { cn } from '@/lib/utils';

interface PassportCardProps {
  stats: PassportStats;
  displayName?: string;
  avatarUrl?: string;
}

export function PassportCard({ stats, displayName = 'Explorer', avatarUrl }: PassportCardProps) {
  const { 
    museumsVisited, 
    statesVisited, 
    categoriesCompleted, 
    totalScore, 
    starRating, 
    completionPercent,
    unlockedTiers,
    totalTiers,
  } = stats;

  return (
    <div className="gallery-card bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-2 border-primary/20 overflow-hidden">
      {/* Header stripe */}
      <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent -mx-4 -mt-4 mb-4" />
      
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-primary/30 bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-2xl text-primary font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground truncate">
            {displayName}
          </h2>
          
          {/* Completion percentage */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl md:text-3xl font-display font-bold text-primary">
              {completionPercent.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">complete</span>
          </div>

          {/* Star rating */}
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4",
                  i < starRating 
                    ? "text-amber-500 fill-amber-500" 
                    : "text-muted-foreground/30"
                )}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">
              {totalScore} pts
            </span>
          </div>
        </div>
      </div>

      {/* Sub-metrics */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="font-display text-lg font-bold text-foreground">
            {museumsVisited}
          </div>
          <div className="text-xs text-muted-foreground">Museums</div>
        </div>
        <div className="text-center border-x border-border/50">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Flag className="w-3.5 h-3.5" />
          </div>
          <div className="font-display text-lg font-bold text-foreground">
            {statesVisited}
          </div>
          <div className="text-xs text-muted-foreground">States</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div className="font-display text-lg font-bold text-foreground">
            {categoriesCompleted}/5
          </div>
          <div className="text-xs text-muted-foreground">Categories</div>
        </div>
      </div>

      {/* Tiers progress bar */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Achievements Unlocked</span>
          <span>{unlockedTiers}/{totalTiers}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${(unlockedTiers / totalTiers) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
