import { useEffect, useRef } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MustVisitFilter } from './MustVisitFilter';
import { OpenTodayFilter } from './OpenTodayFilter';
import { WishListFilter } from './WishListFilter';
import { LocationFilter } from './LocationFilter';
import { DistanceFilter } from './DistanceFilter';
import { CategoryFilterDropdown, type MuseumCategory } from './CategoryFilterDropdown';
import { DateFilter } from './DateFilter';
import { ActiveFilters } from './ActiveFilters';
import { cn } from '@/lib/utils';

interface FilterOverlayProps {
  open: boolean;
  onClose: () => void;
  // Filter state
  mustVisitFilter: boolean;
  onMustVisitToggle: (v: boolean) => void;
  mustVisitCount: number;
  openTodayFilter: boolean;
  onOpenTodayToggle: (v: boolean) => void;
  wishListFilter: boolean;
  onWishListToggle: (v: boolean) => void;
  locationCountry: string | null;
  locationState: string | null;
  locationCity: string | null;
  onLocationChange: (country: string | null, state: string | null, city: string | null) => void;
  availableLocations: { country: string; state: string | null; city: string }[];
  maxDistance: number | null;
  onMaxDistanceChange: (d: number | null) => void;
  hasLocation: boolean;
  categoryFilter: MuseumCategory[];
  onCategoryChange: (c: MuseumCategory[]) => void;
  categoryCounts: Record<string, number>;
  selectedDate: Date;
  onDateChange: (d: Date) => void;
  activeFilterCount: number;
  onClearAll: () => void;
}

export function FilterOverlay({
  open,
  onClose,
  mustVisitFilter, onMustVisitToggle, mustVisitCount,
  openTodayFilter, onOpenTodayToggle,
  wishListFilter, onWishListToggle,
  locationCountry, locationState, locationCity, onLocationChange, availableLocations,
  maxDistance, onMaxDistanceChange, hasLocation,
  categoryFilter, onCategoryChange, categoryCounts,
  selectedDate, onDateChange,
  activeFilterCount, onClearAll,
}: FilterOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Close on click outside (but not on Radix portaled content like popovers/selects)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the overlay
      if (overlayRef.current && overlayRef.current.contains(target)) return;
      // Don't close if clicking inside a Radix portal (popover, select, etc.)
      if (target.closest('[data-radix-popper-content-wrapper]') || target.closest('[role="listbox"]') || target.closest('[data-radix-select-viewport]')) return;
      onClose();
    };
    // Delay to avoid immediate close on the same click that opens
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handler);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className={cn(
        "absolute top-4 left-4 z-[1500] w-80 max-h-[calc(100%-2rem)]",
        "bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-xl",
        "flex flex-col overflow-hidden",
        "animate-in fade-in slide-in-from-left-2 duration-200"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-border">
        <h3 className="font-display font-semibold text-base">Filters</h3>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs text-muted-foreground gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="px-4 pt-3">
          <ActiveFilters
            categories={categoryFilter}
            locationCountry={locationCountry}
            locationState={locationState}
            locationCity={locationCity}
            maxDistance={maxDistance}
            mustVisit={mustVisitFilter}
            openToday={openTodayFilter}
            wishList={wishListFilter}
            selectedDate={selectedDate}
            onRemoveCategory={(cat) => onCategoryChange(categoryFilter.filter(c => c !== cat))}
            onClearLocation={() => onLocationChange(null, null, null)}
            onClearDistance={() => onMaxDistanceChange(null)}
            onClearMustVisit={() => onMustVisitToggle(false)}
            onClearOpenToday={() => onOpenTodayToggle(false)}
            onClearWishList={() => onWishListToggle(false)}
            onClearDate={() => onDateChange(new Date())}
            onClearAll={onClearAll}
          />
        </div>
      )}

      {/* Filter chips */}
      <div className="p-4 space-y-3 overflow-y-auto">
        {/* Quick Toggles */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Quick Toggles</p>
          <div className="flex flex-wrap gap-2">
            <MustVisitFilter enabled={mustVisitFilter} onToggle={onMustVisitToggle} count={mustVisitCount} />
            <OpenTodayFilter enabled={openTodayFilter} onToggle={onOpenTodayToggle} />
            <WishListFilter enabled={wishListFilter} onToggle={onWishListToggle} />
          </div>
        </div>

        {/* Sort & Browse */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sort & Browse</p>
          <div className="flex flex-wrap gap-2">
            <DistanceFilter maxDistance={maxDistance} onMaxDistanceChange={onMaxDistanceChange} hasLocation={hasLocation} />
            <CategoryFilterDropdown selected={categoryFilter} onSelectionChange={onCategoryChange} counts={categoryCounts} />
          </div>
        </div>

        {/* Location */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Location</p>
          <div className="flex flex-wrap gap-2">
            <LocationFilter
              availableLocations={availableLocations}
              selectedCountry={locationCountry}
              selectedState={locationState}
              selectedCity={locationCity}
              onSelectionChange={onLocationChange}
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Date</p>
          <div className="flex flex-wrap gap-2">
            <DateFilter selectedDate={selectedDate} onDateChange={onDateChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
