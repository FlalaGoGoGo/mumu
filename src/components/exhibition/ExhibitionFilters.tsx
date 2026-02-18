import { useState, useEffect } from 'react';
import { Search, X, CalendarIcon, Image } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { ExhibitionLocationFilter, type ExhibitionLocation } from './ExhibitionLocationFilter';
import { ExhibitionStatusFilter } from './ExhibitionStatusFilter';
import { ExhibitionMuseumFilter, type MuseumOption } from './ExhibitionMuseumFilter';
import { ExhibitionViewToggle, type ExhibitionView } from './ExhibitionViewToggle';
import type { ExhibitionStatus } from '@/types/exhibition';

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
  // Status filter
  selectedStatuses: ExhibitionStatus[];
  onStatusesChange: (value: ExhibitionStatus[]) => void;
  // Museum filter
  availableMuseums: MuseumOption[];
  selectedMuseumId: string | null;
  onMuseumChange: (museumId: string | null) => void;
  // Date range
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  // Has image
  hasImageFilter: boolean;
  onHasImageFilterChange: (value: boolean) => void;
  // Clear
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  // View toggle
  currentView: ExhibitionView;
  onViewChange: (view: ExhibitionView) => void;
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
  availableMuseums,
  selectedMuseumId,
  onMuseumChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  hasImageFilter,
  onHasImageFilterChange,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
  currentView,
  onViewChange,
}: ExhibitionFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Search + View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('exhibitions.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <ExhibitionViewToggle view={currentView} onViewChange={onViewChange} />
      </div>

      {/* Row 2: Single-row filter bar — horizontally scrollable */}
      <div className="flex items-center gap-2 overflow-x-auto flex-nowrap pb-1 scrollbar-thin">
        {/* Status */}
        <ExhibitionStatusFilter
          selectedStatuses={selectedStatuses}
          onStatusesChange={onStatusesChange}
        />

        {/* Location */}
        <ExhibitionLocationFilter
          availableLocations={availableLocations}
          selectedRegion={selectedRegion}
          selectedStateProvince={selectedStateProvince}
          selectedCity={selectedCity}
          onSelectionChange={onLocationChange}
        />

        {/* Museum */}
        <ExhibitionMuseumFilter
          museums={availableMuseums}
          selectedMuseumId={selectedMuseumId}
          onMuseumChange={onMuseumChange}
        />

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 px-3 whitespace-nowrap flex-shrink-0 text-sm font-medium gap-1.5",
                dateFrom && "bg-primary/10 text-primary border-primary/30"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateFrom ? format(dateFrom, "MMM d") : t('exhibitions.startDate')}
              {dateFrom && (
                <X
                  className="w-3.5 h-3.5 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDateFromChange(undefined); }}
                />
              )}
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

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 px-3 whitespace-nowrap flex-shrink-0 text-sm font-medium gap-1.5",
                dateTo && "bg-primary/10 text-primary border-primary/30"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateTo ? format(dateTo, "MMM d") : t('exhibitions.endDate')}
              {dateTo && (
                <X
                  className="w-3.5 h-3.5 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDateToChange(undefined); }}
                />
              )}
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

        {/* Has Image toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap h-9 px-2 rounded-md border border-input bg-background">
          <Image className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Image</span>
          <Switch
            checked={hasImageFilter}
            onCheckedChange={onHasImageFilterChange}
            className="scale-75"
          />
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 px-2 text-muted-foreground whitespace-nowrap flex-shrink-0 text-xs gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
