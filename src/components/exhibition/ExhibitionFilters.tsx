import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, CalendarIcon, MapPin, ArrowUp, ArrowDown } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { ExhibitionLocationFilter, type ExhibitionLocation } from './ExhibitionLocationFilter';
import { ExhibitionStatusFilter } from './ExhibitionStatusFilter';
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
  // Location filter
  availableLocations: ExhibitionLocation[];
  selectedRegion: string | null;
  selectedStateProvince: string | null;
  selectedCity: string | null;
  onLocationChange: (region: string | null, stateProvince: string | null, city: string | null) => void;
  // Status filter (multi-select)
  selectedStatuses: ExhibitionStatus[];
  onStatusesChange: (value: ExhibitionStatus[]) => void;
  // Date range
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  // Distance
  hasLocation: boolean;
  hasHomeBase: boolean;
  // Clear
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  // Closing soon
  closingSoon: boolean;
  onClosingSoonChange: (value: boolean) => void;
  // Sort
  dateSortOrder: DateSortOrder;
  onDateSortOrderChange: (value: DateSortOrder) => void;
  distanceSortOrder: DistanceSortOrder;
  onDistanceSortOrderChange: (value: DistanceSortOrder) => void;
}

export function ExhibitionFilters({
  searchQuery,
  onSearchChange,
  availableLocations,
  selectedRegion,
  selectedStateProvince,
  selectedCity,
  onLocationChange,
  selectedStatuses,
  onStatusesChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  hasLocation,
  hasHomeBase,
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

  // Check if current dates match a preset
  useEffect(() => {
    const presets: DatePreset[] = ['this-week', 'this-month', 'next-30-days'];
    const matched = presets.find(p => matchesPreset(dateFrom, dateTo, p));
    setActivePreset(matched || null);
  }, [dateFrom, dateTo]);

  const handlePresetClick = (preset: DatePreset) => {
    if (closingSoon) onClosingSoonChange(false);

    if (activePreset === preset) {
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
    if (newValue) {
      setActivePreset(null);
      onDateFromChange(undefined);
      onDateToChange(undefined);
    }
  };

  // Date sort toggle: none → asc → desc → none
  const handleDateSortToggle = () => {
    if (dateSortOrder === 'none') onDateSortOrderChange('asc');
    else if (dateSortOrder === 'asc') onDateSortOrderChange('desc');
    else onDateSortOrderChange('none');
  };

  // Distance sort toggle: none → asc → desc → none
  const handleDistanceSortToggle = () => {
    if (distanceSortOrder === 'none') onDistanceSortOrderChange('asc');
    else if (distanceSortOrder === 'asc') onDistanceSortOrderChange('desc');
    else onDistanceSortOrderChange('none');
  };

  const canSortByDistance = hasLocation || hasHomeBase;

  const getDistanceTooltip = () => {
    if (!canSortByDistance) return 'Enable location to sort by distance';
    if (distanceSortOrder === 'asc') return 'Sort by distance (near → far)';
    if (distanceSortOrder === 'desc') return 'Sort by distance (far → near)';
    return 'Sort by distance';
  };

  const getDateTooltip = () => {
    if (dateSortOrder === 'asc') return 'Sort by date (ascending)';
    if (dateSortOrder === 'desc') return 'Sort by date (descending)';
    return 'Sort by date';
  };



  return (
    <div className="flex flex-col gap-3">
      {/* Search Row with Sort Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('exhibitions.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters toggle */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="gap-2 h-10">
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

        {/* Date Sort Icon Button */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={dateSortOrder !== 'none' ? 'default' : 'outline'}
                size="icon"
                className={cn(
                  "h-10 w-10 flex-shrink-0",
                  dateSortOrder !== 'none' && "bg-primary text-primary-foreground"
                )}
                onClick={handleDateSortToggle}
              >
                <div className="relative flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                  {dateSortOrder === 'asc' && (
                    <ArrowUp className="w-2.5 h-2.5 absolute -top-1 -right-1.5 stroke-[3]" />
                  )}
                  {dateSortOrder === 'desc' && (
                    <ArrowDown className="w-2.5 h-2.5 absolute -top-1 -right-1.5 stroke-[3]" />
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{getDateTooltip()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Distance Sort Icon Button */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={distanceSortOrder !== 'none' ? 'default' : 'outline'}
                size="icon"
                className={cn(
                  "h-10 w-10 flex-shrink-0",
                  distanceSortOrder !== 'none' && "bg-primary text-primary-foreground",
                  !canSortByDistance && "opacity-50 cursor-not-allowed"
                )}
                onClick={canSortByDistance ? handleDistanceSortToggle : undefined}
                disabled={!canSortByDistance}
              >
                <div className="relative flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                  {distanceSortOrder === 'asc' && (
                    <ArrowUp className="w-2.5 h-2.5 absolute -top-1 -right-1.5 stroke-[3]" />
                  )}
                  {distanceSortOrder === 'desc' && (
                    <ArrowDown className="w-2.5 h-2.5 absolute -top-1 -right-1.5 stroke-[3]" />
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{getDistanceTooltip()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Collapsible Filter Panel */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter (multi-select dropdown) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('exhibitions.status')}</label>
                <ExhibitionStatusFilter
                  selectedStatuses={selectedStatuses}
                  onStatusesChange={onStatusesChange}
                  fullWidth
                />
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('exhibitions.location' as any) || 'Location'}
                </label>
                <ExhibitionLocationFilter
                  availableLocations={availableLocations}
                  selectedRegion={selectedRegion}
                  selectedStateProvince={selectedStateProvince}
                  selectedCity={selectedCity}
                  onSelectionChange={onLocationChange}
                  fullWidth
                />
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
