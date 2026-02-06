import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProfileRowProps {
  label: string;
  value: string;
  placeholder: string;
  onEdit: () => void;
  editLabel?: string;
}

export function ProfileRow({ label, value, placeholder, onEdit, editLabel = 'Edit' }: ProfileRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={cn("text-sm truncate", value ? "text-foreground" : "text-muted-foreground/60 italic")}>
          {value || placeholder}
        </p>
      </div>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onEdit}
              className="ml-3 flex-shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={editLabel}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            {editLabel}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
