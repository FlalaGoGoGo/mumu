import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Navigation, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface DistanceFilterProps {
  maxDistance: number | null;
  onMaxDistanceChange: (distance: number | null) => void;
  hasLocation: boolean;
}

const DISTANCE_PRESETS = [10, 25, 50, 100, 250, 500, 1000, 2500];

export function DistanceFilter({ maxDistance, onMaxDistanceChange, hasLocation }: DistanceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearFilter = () => {
    onMaxDistanceChange(null);
    setIsOpen(false);
  };

  const hasFilter = maxDistance !== null;

  // Find closest preset index for slider
  const getSliderValue = () => {
    if (maxDistance === null) return [DISTANCE_PRESETS.length - 1];
    const index = DISTANCE_PRESETS.findIndex(d => d >= maxDistance);
    return [index === -1 ? DISTANCE_PRESETS.length - 1 : index];
  };

  const handleSliderChange = (value: number[]) => {
    onMaxDistanceChange(DISTANCE_PRESETS[value[0]]);
  };

  const formatDistance = (miles: number) => {
    if (miles >= 1000) {
      return `${(miles / 1000).toFixed(1)}k mi`;
    }
    return `${miles} mi`;
  };

  if (!hasLocation) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-muted/50 text-muted-foreground border border-border cursor-not-allowed">
        <Navigation className="w-3.5 h-3.5" />
        <span>Distance</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          hasFilter
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
        )}
      >
        <Navigation className="w-3.5 h-3.5" />
        <span>
          {hasFilter ? `≤ ${formatDistance(maxDistance)}` : 'Distance'}
        </span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Max Distance
            </span>
            {hasFilter && (
              <button
                onClick={clearFilter}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          
          {/* Slider */}
          <div className="p-4 space-y-4">
            <div className="text-center">
              <span className="text-2xl font-display font-semibold text-foreground">
                {maxDistance ? formatDistance(maxDistance) : 'Any'}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {maxDistance ? 'or closer' : 'No distance limit'}
              </p>
            </div>
            
            <Slider
              value={getSliderValue()}
              onValueChange={handleSliderChange}
              max={DISTANCE_PRESETS.length - 1}
              min={0}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10 mi</span>
              <span>2,500 mi</span>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
              {[25, 100, 500].map(preset => (
                <button
                  key={preset}
                  onClick={() => onMaxDistanceChange(preset)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    maxDistance === preset
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                  )}
                >
                  {formatDistance(preset)}
                </button>
              ))}
              <button
                onClick={clearFilter}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  maxDistance === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                )}
              >
                Any
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
