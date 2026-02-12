import { useState } from 'react';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format, addDays, startOfDay, isToday, isTomorrow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateFilterProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

function getNextSaturday(): Date {
  const today = startOfDay(new Date());
  const day = today.getDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  return addDays(today, daysUntilSat);
}

function getNextSunday(): Date {
  const today = startOfDay(new Date());
  const day = today.getDay();
  const daysUntilSun = (7 - day) % 7 || 7;
  return addDays(today, daysUntilSun);
}

export function DateFilter({ selectedDate, onDateChange }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const today = startOfDay(new Date());

  const isSelectedToday = isToday(selectedDate);

  const label = isSelectedToday
    ? 'Today'
    : isTomorrow(selectedDate)
      ? 'Tomorrow'
      : format(selectedDate, 'EEE, MMM d');

  const handleQuickOption = (date: Date) => {
    onDateChange(date);
    setOpen(false);
    setShowCalendar(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(startOfDay(date));
      setOpen(false);
      setShowCalendar(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setShowCalendar(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            !isSelectedToday
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{label}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 z-50 bg-popover"
        align="start"
        sideOffset={6}
      >
        {showCalendar ? (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            disabled={(date) => startOfDay(date) < today}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        ) : (
          <div className="flex flex-col p-1 min-w-[180px]">
            <button
              onClick={() => handleQuickOption(today)}
              className={cn(
                "text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors",
                isSelectedToday && "font-semibold text-primary"
              )}
            >
              Today
            </button>
            <button
              onClick={() => handleQuickOption(addDays(today, 1))}
              className={cn(
                "text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors",
                isTomorrow(selectedDate) && "font-semibold text-primary"
              )}
            >
              Tomorrow
            </button>
            <button
              onClick={() => handleQuickOption(getNextSaturday())}
              className="text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
            >
              This Saturday
            </button>
            <button
              onClick={() => handleQuickOption(getNextSunday())}
              className="text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
            >
              This Sunday
            </button>
            <div className="border-t my-1" />
            <button
              onClick={() => setShowCalendar(true)}
              className="text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Pick a date…
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
