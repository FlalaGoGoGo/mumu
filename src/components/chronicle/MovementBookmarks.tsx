import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { MovementCount } from '@/hooks/useChronicleData';

interface MovementBookmarksProps {
  movements: MovementCount[];
  rangeMovementCounts: Map<string, number>;
  selectedMovements: Set<string>;
  onMovementToggle: (movement: string) => void;
}

export function MovementBookmarks({
  movements,
  rangeMovementCounts,
  selectedMovements,
  onMovementToggle,
}: MovementBookmarksProps) {
  // Sort movements by range count (for current year filter)
  const sortedMovements = [...movements]
    .filter(m => (rangeMovementCounts.get(m.movement) || 0) > 0)
    .sort((a, b) => {
      const countA = rangeMovementCounts.get(a.movement) || 0;
      const countB = rangeMovementCounts.get(b.movement) || 0;
      return countB - countA;
    });

  return (
    <div className="h-[50vh]">
      <h4 className="text-xs font-medium text-[hsl(var(--ink-muted))] uppercase tracking-wider mb-3">
        Movements
      </h4>
      <ScrollArea className="h-[calc(100%-2rem)]">
        <div className="space-y-1 pr-2">
          {sortedMovements.map((mc) => {
            const isSelected = selectedMovements.has(mc.movement);
            const count = rangeMovementCounts.get(mc.movement) || 0;
            const isFaded = selectedMovements.size > 0 && !isSelected;

            return (
              <button
                key={mc.movement}
                onClick={() => onMovementToggle(mc.movement)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-sm transition-all duration-200",
                  "border-l-4",
                  "hover:bg-[hsl(var(--parchment-dark)/0.5)]",
                  isSelected
                    ? "border-l-[hsl(var(--gold-border))] bg-[hsl(var(--gold-border)/0.1)]"
                    : "border-l-[hsl(var(--parchment-edge))]",
                  isFaded && "opacity-40"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "text-sm truncate",
                    isSelected ? "text-[hsl(var(--ink))] font-medium" : "text-[hsl(var(--ink-muted))]"
                  )}>
                    {mc.movement}
                  </span>
                  <span className={cn(
                    "text-xs shrink-0",
                    isSelected ? "text-[hsl(var(--gold-border))]" : "text-[hsl(var(--ink-muted)/0.6)]"
                  )}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
