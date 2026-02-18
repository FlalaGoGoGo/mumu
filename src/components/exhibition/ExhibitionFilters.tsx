import { useState } from 'react';
import { Search, X, CalendarIcon, Image, SlidersHorizontal } from 'lucide-react';
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
  availableLocations: ExhibitionLocation[];
  selectedRegion: string | null;
  selectedStateProvince: string | null;
  selectedCity: string | null;
  onLocationChange: (region: string | null, stateProvince: string | null, city: string | null) => void;
  selectedStatuses: ExhibitionStatus[];
  onStatusesChange: (value: ExhibitionStatus[]) => void;
  availableMuseums: MuseumOption[];
  selectedMuseumId: string | null;
  onMuseumChange: (museumId: string | null) => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  hasImageFilter: boolean;
  onHasImageFilterChange: (value: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
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
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* Row: Search + Filters button + View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('exhibitions.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters button with popover panel */}
        <Popover open={panelOpen} onOpenChange={setPanelOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className={cn(
                "h-10 px-3 gap-1.5 whitespace-nowrap",
                activeFilterCount > 0 && "bg-primary/10 text-primary border-primary/30"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-auto min-w-[360px] max-w-[90vw] p-4 z-[120]"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Filters</span>
                {hasActiveFilters && (
                  <button
                    onClick={() => { onClearFilters(); setPanelOpen(false); }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              {/* Filter controls in a wrapping row inside the panel */}
              <div className="flex flex-wrap items-center gap-2">
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
                  <PopoverContent className="w-auto p-0 z-[130]" align="start">
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
                  <PopoverContent className="w-auto p-0 z-[130]" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={onDateToChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>

                {/* Has-Image toggle */}
                <div className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium whitespace-nowrap",
                  "border transition-all",
                  hasImageFilter
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-background text-foreground border-input"
                )}>
                  <Image className="w-3.5 h-3.5" />
                  <span>Has-Image</span>
                  <Switch
                    checked={hasImageFilter}
                    onCheckedChange={onHasImageFilterChange}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <ExhibitionViewToggle view={currentView} onViewChange={onViewChange} />
      </div>
    </div>
  );
}
