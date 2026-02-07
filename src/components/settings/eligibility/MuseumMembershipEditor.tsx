import { useState, useMemo } from 'react';
import { X, Plus, Search, CalendarIcon, AlertTriangle } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useMuseums } from '@/hooks/useMuseums';
import type { MuseumMembershipEntry } from '@/types/eligibility';

interface MuseumMembershipEditorProps {
  memberships: MuseumMembershipEntry[];
  onChange: (memberships: MuseumMembershipEntry[]) => void;
}

function isExpired(dateStr: string): boolean {
  return isBefore(new Date(dateStr), startOfDay(new Date()));
}

function MembershipRow({
  entry,
  onRemove,
  onDateChange,
}: {
  entry: MuseumMembershipEntry;
  onRemove: () => void;
  onDateChange: (date: string) => void;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const expired = entry.expires_on ? isExpired(entry.expires_on) : false;
  const selectedDate = entry.expires_on ? new Date(entry.expires_on) : undefined;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 bg-background/50">
      <span className="text-sm flex-1 min-w-0 truncate font-medium text-foreground">
        {entry.museum_name}
      </span>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-7 text-xs gap-1.5 shrink-0',
              !entry.expires_on && 'text-muted-foreground',
              expired && 'border-destructive/40 text-destructive'
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {entry.expires_on
              ? format(new Date(entry.expires_on), 'MM/dd/yyyy')
              : 'Set expiry'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-[9999]" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                onDateChange(date.toISOString().split('T')[0]);
              }
              setCalendarOpen(false);
            }}
            className={cn('p-3 pointer-events-auto')}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {expired && (
        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
      )}

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label={`Remove ${entry.museum_name}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function MuseumMembershipEditor({ memberships, onChange }: MuseumMembershipEditorProps) {
  const { data: museums = [] } = useMuseums();
  const [search, setSearch] = useState('');

  const selectedIds = new Set(memberships.map((m) => m.museum_id));

  const filtered = useMemo(() => {
    const available = museums.filter((m) => !selectedIds.has(m.museum_id));
    if (!search) return available.slice(0, 8);
    const q = search.toLowerCase();
    return available
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          (m.state || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [museums, search, selectedIds]);

  const handleAdd = (museumId: string, museumName: string) => {
    onChange([
      ...memberships,
      { museum_id: museumId, museum_name: museumName, expires_on: '' },
    ]);
    setSearch('');
  };

  const handleRemove = (museumId: string) => {
    onChange(memberships.filter((m) => m.museum_id !== museumId));
  };

  const handleDateChange = (museumId: string, date: string) => {
    onChange(
      memberships.map((m) =>
        m.museum_id === museumId ? { ...m, expires_on: date } : m
      )
    );
  };

  return (
    <div className="space-y-3 mt-3 pl-8 border-l-2 border-border/40">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Your Museum Memberships
      </p>

      {/* Current memberships */}
      {memberships.length > 0 && (
        <div className="space-y-1.5">
          {memberships.map((entry) => (
            <MembershipRow
              key={entry.museum_id}
              entry={entry}
              onRemove={() => handleRemove(entry.museum_id)}
              onDateChange={(date) => handleDateChange(entry.museum_id, date)}
            />
          ))}
          {memberships.some((m) => m.expires_on && isExpired(m.expires_on)) && (
            <p className="text-xs text-destructive/80 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Some memberships have expired
            </p>
          )}
          {memberships.some((m) => !m.expires_on) && (
            <p className="text-xs text-muted-foreground italic">
              Set expiration dates to enable eligibility filtering
            </p>
          )}
        </div>
      )}

      {/* Search to add */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search museums…"
          className="pl-8 h-8 text-sm"
        />
      </div>

      {(search || filtered.length > 0) && (
        <div className="max-h-[160px] overflow-y-auto space-y-0.5 rounded-md border border-border/40 bg-popover">
          {filtered.map((museum) => (
            <button
              key={museum.museum_id}
              type="button"
              onClick={() => handleAdd(museum.museum_id, museum.name)}
              className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-accent/50 transition-colors flex items-center gap-2"
            >
              <Plus className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{museum.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {museum.city}
                {museum.state ? `, ${museum.state}` : ''}
              </span>
            </button>
          ))}
          {filtered.length === 0 && search && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No museums found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
