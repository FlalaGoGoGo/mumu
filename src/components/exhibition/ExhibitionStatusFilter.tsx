import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import type { ExhibitionStatus } from '@/types/exhibition';

const USER_VISIBLE_STATUSES: ExhibitionStatus[] = ['Ongoing', 'Upcoming', 'Past'];
const DEFAULT_STATUSES: ExhibitionStatus[] = ['Ongoing', 'Upcoming'];

function getStatusLabelKey(status: ExhibitionStatus): string {
  switch (status) {
    case 'Ongoing': return 'exhibitions.ongoing';
    case 'Upcoming': return 'exhibitions.upcoming';
    case 'Past': return 'exhibitions.past';
    default: return status;
  }
}

interface ExhibitionStatusFilterProps {
  selectedStatuses: ExhibitionStatus[];
  onStatusesChange: (value: ExhibitionStatus[]) => void;
  /** When true, button fills parent width */
  fullWidth?: boolean;
}

export function ExhibitionStatusFilter({
  selectedStatuses,
  onStatusesChange,
  fullWidth = false,
}: ExhibitionStatusFilterProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (status: ExhibitionStatus) => {
    const isSelected = selectedStatuses.includes(status);
    if (isSelected) {
      const newStatuses = selectedStatuses.filter(s => s !== status);
      // Prevent empty selection — revert to defaults
      if (newStatuses.length === 0) {
        onStatusesChange(DEFAULT_STATUSES);
      } else {
        onStatusesChange(newStatuses);
      }
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  const allSelected = selectedStatuses.length === USER_VISIBLE_STATUSES.length;
  const hasSelection = selectedStatuses.length > 0 && !allSelected;

  const getButtonLabel = () => {
    if (allSelected || selectedStatuses.length === 0) {
      return t('exhibitions.allStatuses' as any) || 'All statuses';
    }
    // Show selected labels in order
    const orderedSelected = USER_VISIBLE_STATUSES.filter(s => selectedStatuses.includes(s));
    return orderedSelected.map(s => t(getStatusLabelKey(s) as any)).join(', ');
  };

  const clearFilter = () => {
    onStatusesChange(DEFAULT_STATUSES);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", fullWidth ? "w-full" : "flex-shrink-0")} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium transition-all whitespace-nowrap",
          "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          fullWidth && "w-full",
          hasSelection
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <span className={cn("truncate", fullWidth ? "flex-1 text-left" : "max-w-[160px]")}>
          {getButtonLabel()}
        </span>
        {hasSelection ? (
          <X
            className="w-3.5 h-3.5 flex-shrink-0 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); clearFilter(); }}
          />
        ) : (
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )} />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[180px] bg-popover border border-border rounded-lg shadow-lg z-[150] overflow-hidden">
          <div className="py-1">
            {USER_VISIBLE_STATUSES.map(status => {
              const isSelected = selectedStatuses.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => handleToggle(status)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-primary/5"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-4 h-4 rounded border transition-colors flex-shrink-0",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input"
                  )}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <span className="flex-1 text-left">{t(getStatusLabelKey(status) as any)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
