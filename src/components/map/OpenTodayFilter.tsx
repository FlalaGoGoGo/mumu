import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpenTodayFilterProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function OpenTodayFilter({ enabled, onToggle }: OpenTodayFilterProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        enabled
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>Open</span>
    </button>
  );
}
