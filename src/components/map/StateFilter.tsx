import { useState, useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

interface StateFilterProps {
  availableStates: string[];
  selectedStates: string[];
  onSelectionChange: (states: string[]) => void;
}

export function StateFilter({ availableStates, selectedStates, onSelectionChange }: StateFilterProps) {
  const { t } = useLanguage();
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

  const toggleState = (state: string) => {
    if (selectedStates.includes(state)) {
      onSelectionChange(selectedStates.filter(s => s !== state));
    } else {
      onSelectionChange([...selectedStates, state]);
    }
  };

  const clearAll = () => {
    onSelectionChange([]);
    setIsOpen(false);
  };

  const hasSelection = selectedStates.length > 0;

  const getButtonLabel = () => {
    if (!hasSelection) return t('map.state');
    if (selectedStates.length === 1) return selectedStates[0];
    return `${selectedStates.length} ${t('map.statesSelected')}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          hasSelection
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
        )}
      >
        <MapPin className="w-3.5 h-3.5" />
        <span>{getButtonLabel()}</span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('map.filterByState')}
            </span>
            {hasSelection && (
              <button
                onClick={clearAll}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {t('common.clear')}
              </button>
            )}
          </div>
          
          {/* State List */}
          <div className="max-h-64 overflow-y-auto">
            {availableStates.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                {t('map.noStatesAvailable')}
              </div>
            ) : (
              availableStates.map((state) => {
                const isSelected = selectedStates.includes(state);
                return (
                  <button
                    key={state}
                    onClick={() => toggleState(state)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-primary/5"
                    )}
                  >
                    <span className={cn(
                      "font-medium",
                      isSelected && "text-primary"
                    )}>
                      {state}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
