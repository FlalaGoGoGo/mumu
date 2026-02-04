import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { TimeBucket, MovementCount } from '@/hooks/useChronicleData';

interface TimelineBucketProps {
  bucket: TimeBucket;
  isSelected: boolean;
  selectedMovements: Set<string>;
  onBucketClick: () => void;
  onMovementClick: (movement: string) => void;
}

export function TimelineBucket({
  bucket,
  isSelected,
  selectedMovements,
  onBucketClick,
  onMovementClick,
}: TimelineBucketProps) {
  // Check if any of the bucket's movements are selected
  const hasSelectedMovement = bucket.topMovements.some(m => selectedMovements.has(m.movement));
  
  // Calculate opacity based on whether selected movements are present
  const fadeOut = selectedMovements.size > 0 && !hasSelectedMovement;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onBucketClick}
          className={cn(
            "w-full text-left p-4 rounded-md transition-all duration-200",
            "border border-[hsl(var(--parchment-edge))]",
            "hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
            isSelected
              ? "bg-[hsl(var(--gold-border)/0.15)] border-[hsl(var(--gold-border))] shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
              : "bg-[hsl(var(--parchment-dark)/0.3)] hover:bg-[hsl(var(--parchment-dark)/0.5)]",
            fadeOut && "opacity-40"
          )}
        >
          {/* Bucket header */}
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-display text-lg font-semibold text-[hsl(var(--ink))]">
              {bucket.label}
            </h3>
            <span className="text-sm text-[hsl(var(--ink-muted))]">
              {bucket.totalCount} artwork{bucket.totalCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Top 3 movements as ink labels */}
          <div className="flex flex-wrap gap-2">
            {bucket.topMovements.slice(0, 3).map((mc) => (
              <Badge
                key={mc.movement}
                variant="outline"
                className={cn(
                  "text-xs cursor-pointer transition-colors",
                  "bg-transparent border-[hsl(var(--ink)/0.2)] text-[hsl(var(--ink-muted))]",
                  "hover:bg-[hsl(var(--ink)/0.05)] hover:border-[hsl(var(--ink)/0.3)]",
                  selectedMovements.has(mc.movement) && 
                    "bg-[hsl(var(--gold-border)/0.2)] border-[hsl(var(--gold-border))] text-[hsl(var(--ink))]"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onMovementClick(mc.movement);
                }}
              >
                {mc.movement} ({mc.count})
              </Badge>
            ))}
            {bucket.topMovements.length > 3 && (
              <span className="text-xs text-[hsl(var(--ink-muted))]">
                +{bucket.topMovements.length - 3} more
              </span>
            )}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="right" 
        className="max-w-xs bg-[hsl(var(--parchment))] border-[hsl(var(--gold-border))]"
      >
        <div className="space-y-1">
          <p className="font-display font-semibold text-[hsl(var(--ink))]">
            {bucket.label} — Top Movements
          </p>
          {bucket.topMovements.slice(0, 5).map((mc) => (
            <div key={mc.movement} className="flex justify-between text-sm">
              <span className="text-[hsl(var(--ink-muted))]">{mc.movement}</span>
              <span className="text-[hsl(var(--ink))] font-medium">{mc.count}</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
