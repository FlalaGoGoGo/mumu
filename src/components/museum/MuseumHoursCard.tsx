import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DayHours {
  day: string;      // e.g. "Mon", "Tue"
  hours: string;    // e.g. "11–5", "Closed"
}

interface MuseumHoursCardProps {
  hours: DayHours[];
  closedDates?: string[];  // optional YYYY-MM-DD overrides
}

const DAY_ABBR_TO_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getClosedWeekdays(hours: DayHours[]): Set<number> {
  const closed = new Set<number>();
  hours.forEach((h) => {
    const idx = DAY_ABBR_TO_INDEX[h.day];
    if (idx !== undefined && h.hours.toLowerCase() === 'closed') {
      closed.add(idx);
    }
  });
  return closed;
}

function getHoursForWeekday(hours: DayHours[], weekday: number): string {
  const abbr = WEEKDAY_HEADERS[weekday];
  const match = hours.find((h) => h.day === abbr);
  return match ? match.hours : '—';
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MuseumHoursCard({ hours, closedDates = [] }: MuseumHoursCardProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const closedWeekdays = useMemo(() => getClosedWeekdays(hours), [hours]);

  const closedDateSet = useMemo(() => new Set(closedDates), [closedDates]);

  const isDateClosed = (date: Date) => {
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (closedDateSet.has(iso)) return true;
    return closedWeekdays.has(date.getDay());
  };

  const isToday = (day: number) =>
    viewYear === today.getFullYear() &&
    viewMonth === today.getMonth() &&
    day === today.getDate();

  const isSelected = (day: number) =>
    viewYear === selectedDate.getFullYear() &&
    viewMonth === selectedDate.getMonth() &&
    day === selectedDate.getDate();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth, day));
  };

  const selectedHours = getHoursForWeekday(hours, selectedDate.getDay());
  const selectedIsClosed = isDateClosed(selectedDate);

  const formatSelectedDate = () => {
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    return selectedDate.toLocaleDateString('en-US', opts);
  };

  return (
    <div className="p-4 bg-card border border-border rounded-lg">
      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Hours
      </h3>

      {/* Calendar header */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_HEADERS.map((d) => (
          <div
            key={d}
            className={cn(
              'text-center text-[0.65rem] font-medium py-1',
              closedWeekdays.has(DAY_ABBR_TO_INDEX[d])
                ? 'text-destructive/60'
                : 'text-muted-foreground'
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e-${i}`} className="h-8" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(viewYear, viewMonth, day);
          const closed = isDateClosed(date);
          const todayMatch = isToday(day);
          const selected = isSelected(day);

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={cn(
                'h-8 w-full text-xs rounded-md transition-colors relative',
                'hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                closed && !selected && 'text-destructive/70',
                todayMatch && !selected && 'font-bold bg-accent text-accent-foreground',
                selected && 'bg-primary text-primary-foreground font-semibold',
                !closed && !todayMatch && !selected && 'text-foreground'
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selected day summary */}
      <div className="mt-3 px-1 py-2 border-t border-border">
        <p className="text-xs text-muted-foreground mb-0.5">
          {formatSelectedDate()}
        </p>
        <p
          className={cn(
            'text-sm font-medium',
            selectedIsClosed ? 'text-destructive' : 'text-foreground'
          )}
        >
          {selectedIsClosed ? 'Closed' : `Open ${selectedHours}`}
        </p>
      </div>

      {/* Weekly hours list */}
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Weekly Hours
        </p>
        <div className="space-y-1">
          {hours.map((h) => (
            <div key={h.day} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{h.day}</span>
              <span
                className={cn(
                  h.hours.toLowerCase() === 'closed'
                    ? 'text-destructive font-medium'
                    : 'text-foreground'
                )}
              >
                {h.hours}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
