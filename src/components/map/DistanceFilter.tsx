import { useState, useEffect } from 'react';
import { ChevronDown, Navigation, X, Minus, Plus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

interface DistanceFilterProps {
  maxDistance: number | null;
  onMaxDistanceChange: (distance: number | null) => void;
  hasLocation: boolean;
}

const DISTANCE_PRESETS = [10, 25, 50, 100, 250, 500, 1000, 2500];
const MIN_DISTANCE = 1;
const MAX_DISTANCE = 5000;

export function DistanceFilter({ maxDistance, onMaxDistanceChange, hasLocation }: DistanceFilterProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(maxDistance?.toString() || '');

  useEffect(() => {
    setInputValue(maxDistance?.toString() || '');
  }, [maxDistance]);

  const clearFilter = () => {
    onMaxDistanceChange(null);
    setInputValue('');
    setIsOpen(false);
  };

  const hasFilter = maxDistance !== null;

  const getSliderValue = () => {
    if (maxDistance === null) return [DISTANCE_PRESETS.length - 1];
    let closestIndex = 0;
    let closestDiff = Math.abs(DISTANCE_PRESETS[0] - maxDistance);
    DISTANCE_PRESETS.forEach((preset, index) => {
      const diff = Math.abs(preset - maxDistance);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = index;
      }
    });
    return [closestIndex];
  };

  const handleSliderChange = (value: number[]) => {
    const newDistance = DISTANCE_PRESETS[value[0]];
    onMaxDistanceChange(newDistance);
    setInputValue(newDistance.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= MIN_DISTANCE && numValue <= MAX_DISTANCE) {
      onMaxDistanceChange(numValue);
    }
  };

  const handleInputBlur = () => {
    if (inputValue === '') {
      onMaxDistanceChange(null);
      return;
    }
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < MIN_DISTANCE) {
      setInputValue(maxDistance?.toString() || '');
    } else if (numValue > MAX_DISTANCE) {
      onMaxDistanceChange(MAX_DISTANCE);
      setInputValue(MAX_DISTANCE.toString());
    }
  };

  const adjustDistance = (delta: number) => {
    const current = maxDistance || 100;
    const step = current < 100 ? 10 : current < 500 ? 25 : 100;
    const newValue = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, current + (delta * step)));
    onMaxDistanceChange(newValue);
    setInputValue(newValue.toString());
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
        <span>{t('map.distance')}</span>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
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
            {hasFilter ? `≤ ${formatDistance(maxDistance)}` : t('map.distance')}
          </span>
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-0 z-[9999]"
        align="start"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        avoidCollisions
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('map.maxDistance')}
          </span>
          {hasFilter && (
            <button
              onClick={clearFilter}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              {t('common.clear')}
            </button>
          )}
        </div>
        
        {/* Distance Display & Input */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => adjustDistance(-1)}
              disabled={maxDistance === null || maxDistance <= MIN_DISTANCE}
              className="p-2 rounded-full border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <div className="flex items-baseline gap-1">
              <Input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="Any"
                min={MIN_DISTANCE}
                max={MAX_DISTANCE}
                className="w-20 h-10 text-center text-lg font-display font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm text-muted-foreground">mi</span>
            </div>
            
            <button
              onClick={() => adjustDistance(1)}
              disabled={maxDistance !== null && maxDistance >= MAX_DISTANCE}
              className="p-2 rounded-full border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {maxDistance ? t('map.orCloser') : t('map.noDistanceLimit')}
          </p>
          
          <div className="relative group">
            <Slider
              value={getSliderValue()}
              onValueChange={handleSliderChange}
              max={DISTANCE_PRESETS.length - 1}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10 mi</span>
              <span>2,500 mi</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            {[25, 100, 500, 1000].map(preset => (
              <button
                key={preset}
                onClick={() => {
                  onMaxDistanceChange(preset);
                  setInputValue(preset.toString());
                }}
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
              {t('map.any')}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
