import { useState } from 'react';
import { Search, X, CalendarIcon, Image, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
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
    <div className="flex flex-col gap-3">
      {/* Toolbar Row — matches Arts page pattern */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('exhibitions.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters toggle — same pattern as Arts */}
        <Button
          variant="outline"
          className="gap-2 h-10 flex-shrink-0"
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* View Toggle */}
        <ExhibitionViewToggle view={currentView} onViewChange={onViewChange} />
      </div>

      {/* Collapsible Filter Panel — same structure as Arts */}
      <Collapsible open={panelOpen} onOpenChange={setPanelOpen}>
        <CollapsibleContent>
          <div className="relative z-[2000] p-4 bg-muted/50 rounded-lg border space-y-3">
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
                    className={cn(
                      "justify-between whitespace-nowrap",
                      dateFrom && "bg-primary/10 text-primary border-primary/30"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateFrom ? format(dateFrom, "MMM d") : t('exhibitions.startDate')}
                    {dateFrom && (
                      <X
                        className="w-3.5 h-3.5 ml-1 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDateFromChange(undefined); }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
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
                    className={cn(
                      "justify-between whitespace-nowrap",
                      dateTo && "bg-primary/10 text-primary border-primary/30"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateTo ? format(dateTo, "MMM d") : t('exhibitions.endDate')}
                    {dateTo && (
                      <X
                        className="w-3.5 h-3.5 ml-1 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDateToChange(undefined); }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
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
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                <Switch
                  id="exhibition-has-image"
                  checked={hasImageFilter}
                  onCheckedChange={onHasImageFilterChange}
                />
                <Label htmlFor="exhibition-has-image" className="cursor-pointer text-sm whitespace-nowrap">
                  Has Image
                </Label>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={() => { onClearFilters(); setPanelOpen(false); }} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" />
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
