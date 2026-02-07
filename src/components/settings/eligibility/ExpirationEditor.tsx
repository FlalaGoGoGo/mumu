import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ExpirationEditorProps {
  expiresOn?: string;
  lifetime?: boolean;
  onExpiresOnChange: (date?: string) => void;
  onLifetimeChange: (lifetime: boolean) => void;
  compact?: boolean;
}

export function ExpirationEditor({
  expiresOn,
  lifetime,
  onExpiresOnChange,
  onLifetimeChange,
  compact,
}: ExpirationEditorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDate = expiresOn ? new Date(expiresOn) : undefined;

  return (
    <div
      className={cn('flex items-center gap-2', compact ? 'text-xs' : 'text-sm')}
      onClick={(e) => e.stopPropagation()}
    >
      {!lifetime && (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                compact ? 'h-6 text-[11px] gap-1 px-2' : 'h-7 text-xs gap-1.5',
                !expiresOn && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="h-3 w-3" />
              {expiresOn
                ? format(new Date(expiresOn), 'MM/dd/yyyy')
                : 'Set expiry'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) onExpiresOnChange(date.toISOString().split('T')[0]);
                setCalendarOpen(false);
              }}
              className={cn('p-3 pointer-events-auto')}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
      <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
        <Checkbox
          checked={!!lifetime}
          onCheckedChange={(checked) => {
            const isLifetime = !!checked;
            onLifetimeChange(isLifetime);
            if (isLifetime) onExpiresOnChange(undefined);
          }}
          className="h-3.5 w-3.5"
        />
        <span
          className={cn(
            'text-muted-foreground whitespace-nowrap',
            compact ? 'text-[11px]' : 'text-xs'
          )}
        >
          Lifetime
        </span>
      </label>
    </div>
  );
}
