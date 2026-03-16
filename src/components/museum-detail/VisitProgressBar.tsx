import { Eye, SkipForward, Bookmark, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVisitProgress } from './VisitProgressContext';

interface VisitProgressBarProps {
  totalSteps: number;
}

export function VisitProgressBar({ totalSteps }: VisitProgressBarProps) {
  const { seenCount, skippedCount, savedCount, remainingCount, isTimeConstrained, setTimeConstrained } = useVisitProgress();
  const progress = totalSteps > 0 ? ((seenCount + skippedCount) / totalSteps) * 100 : 0;

  return (
    <section className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Visit Progress</h3>
        {!isTimeConstrained && remainingCount > 2 && (
          <button
            onClick={() => setTimeConstrained(true)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Clock className="w-3 h-3" /> Running short on time?
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs">
        <span className={cn('flex items-center gap-1', seenCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
          <Eye className="w-3.5 h-3.5 text-primary" /> {seenCount} seen
        </span>
        <span className={cn('flex items-center gap-1', skippedCount > 0 ? 'text-foreground' : 'text-muted-foreground')}>
          <SkipForward className="w-3.5 h-3.5" /> {skippedCount} skipped
        </span>
        <span className={cn('flex items-center gap-1', savedCount > 0 ? 'text-foreground' : 'text-muted-foreground')}>
          <Bookmark className="w-3.5 h-3.5" /> {savedCount} saved
        </span>
        <span className="text-muted-foreground ml-auto">
          {remainingCount} remaining
        </span>
      </div>

      {/* Time constrained mode */}
      {isTimeConstrained && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-medium text-foreground">⚡ Focus mode — showing only must-see stops</p>
          <p className="text-xs text-muted-foreground">
            Skip optional stops and focus on the essential works. You can save skipped stops for a future visit.
          </p>
          <button
            onClick={() => setTimeConstrained(false)}
            className="text-xs text-primary hover:underline"
          >
            Back to full route
          </button>
        </div>
      )}
    </section>
  );
}
