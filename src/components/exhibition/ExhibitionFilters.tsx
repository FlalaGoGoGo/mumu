import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import type { ExhibitionStatus } from '@/types/exhibition';

type DatePreset = 'this-week' | 'this-month' | 'next-30-days' | null;

function getDatePresetRange(preset: DatePreset): { from: Date; to: Date } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'this-week':
      return { from: startOfWeek(today, { weekStartsOn: 0 }), to: endOfWeek(today, { weekStartsOn: 0 }) };
    case 'this-month':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case 'next-30-days':
      return { from: today, to: addDays(today, 30) };
    default:
      return null;
  }
}

function matchesPreset(from: Date | undefined, to: Date | undefined, preset: DatePreset): boolean {
  if (!from || !to || !preset) return false;
  const range = getDatePresetRange(preset);
  if (!range) return false;
  return from.getTime() === range.from.getTime() && to.getTime() === range.to.getTime();
}

export type DateSortOrder = 'none' | 'asc' | 'desc';
export type DistanceSortOrder = 'none' | 'asc' | 'desc';

interface ExhibitionFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  states: string[];
  selectedState: string;
  onStateChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  maxDistance: number;
  onMaxDistanceChange: (value: number) => void;
  hasLocation: boolean;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  closingSoon: boolean;
  onClosingSoonChange: (value: boolean) => void;
  dateSortOrder: DateSortOrder;
  onDateSortOrderChange: (value: DateSortOrder) => void;
  distanceSortOrder: DistanceSortOrder;
  onDistanceSortOrderChange: (value: DistanceSortOrder) => void;
}

export function ExhibitionFilters({
  searchQuery,
  onSearchChange,
  states,
  selectedState,
  onStateChange,
  selectedStatus,
  onStatusChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  hasLocation,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
  closingSoon,
  onClosingSoonChange,
  dateSortOrder,
  onDateSortOrderChange,
  distanceSortOrder,
  onDistanceSortOrderChange,
}: ExhibitionFiltersProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<DatePreset>(null);

  // Status options with translations
  const STATUS_OPTIONS: { value: ExhibitionStatus | 'all'; labelKey: string }[] = [
    { value: 'all', labelKey: 'exhibitions.allStatuses' },
    { value: 'Ongoing', labelKey: 'exhibitions.ongoing' },
    { value: 'Upcoming', labelKey: 'exhibitions.upcoming' },
    { value: 'Past', labelKey: 'exhibitions.past' },
    { value: 'TBD', labelKey: 'exhibitions.tbd' },
  ];

  // Date sort options with translations
  const DATE_SORT_OPTIONS = [
    { value: 'none' as const, labelKey: 'exhibitions.dateSort' },
    { value: 'asc' as const, labelKey: 'exhibitions.dateSortAsc' },
    { value: 'desc' as const, labelKey: 'exhibitions.dateSortDesc' },
  ];

  // Distance sort options with translations
  const DISTANCE_SORT_OPTIONS = [
    { value: 'none' as const, labelKey: 'exhibitions.distanceSort' },
    { value: 'asc' as const, labelKey: 'exhibitions.distanceSortAsc' },
    { value: 'desc' as const, labelKey: 'exhibitions.distanceSortDesc' },
  ];

  // Check if current dates match a preset
  useEffect(() => {
    const presets: DatePreset[] = ['this-week', 'this-month', 'next-30-days'];
    const matched = presets.find(p => matchesPreset(dateFrom, dateTo, p));
    setActivePreset(matched || null);
  }, [dateFrom, dateTo]);

  const handlePresetClick = (preset: DatePreset) => {
    // When selecting a date preset, turn off Closing Soon
    if (closingSoon) {
      onClosingSoonChange(false);
    }
    
    if (activePreset === preset) {
      // Deselect
      setActivePreset(null);
      onDateFromChange(undefined);
      onDateToChange(undefined);
    } else {
      const range = getDatePresetRange(preset);
      if (range) {
        setActivePreset(preset);
        onDateFromChange(range.from);
        onDateToChange(range.to);
      }
    }
  };

  const handleClosingSoonClick = () => {
    const newValue = !closingSoon;
    onClosingSoonChange(newValue);
    
    // When turning on Closing Soon, clear date presets
    if (newValue) {
      setActivePreset(null);
      onDateFromChange(undefined);
      onDateToChange(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Row with Sort Controls */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('exhibitions.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{t('exhibitions.filters')}</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {/* Date Sort */}
        <Select value={dateSortOrder} onValueChange={(v) => onDateSortOrderChange(v as DateSortOrder)}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Distance Sort */}
        <Select 
          value={distanceSortOrder} 
          onValueChange={(v) => onDistanceSortOrderChange(v as DistanceSortOrder)}
          disabled={!hasLocation}
        >
          <SelectTrigger className={cn("w-[110px]", !hasLocation && "opacity-50")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISTANCE_SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey as any)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Collapsible Filter Panel */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* State Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('exhibitions.state')}</label>
                <Select value={selectedState} onValueChange={onStateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('exhibitions.allStates')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('exhibitions.allStates')}</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('exhibitions.status')}</label>
                <Select value={selectedStatus} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('exhibitions.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('exhibitions.from')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM d, yyyy") : t('exhibitions.startDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={onDateFromChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('exhibitions.to')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM d, yyyy") : t('exhibitions.endDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={onDateToChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" />
                  {t('exhibitions.clearFilters')}
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
