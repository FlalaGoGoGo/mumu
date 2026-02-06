import { LayoutGrid, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ExhibitionView = 'card' | 'map';

interface ExhibitionViewToggleProps {
  view: ExhibitionView;
  onViewChange: (view: ExhibitionView) => void;
}

export function ExhibitionViewToggle({ view, onViewChange }: ExhibitionViewToggleProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="inline-flex items-center rounded-md border border-input overflow-hidden h-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onViewChange('card')}
              className={cn(
                "flex items-center justify-center w-10 h-full transition-colors",
                view === 'card'
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              aria-label="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Card view</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onViewChange('map')}
              className={cn(
                "flex items-center justify-center w-10 h-full transition-colors border-l border-input",
                view === 'map'
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              aria-label="Map view"
            >
              <Map className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>Map view</p></TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
