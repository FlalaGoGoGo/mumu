import { X } from 'lucide-react';
import { EligibilityItem, getEligibilityDisplayLabel } from '@/types/eligibility';
import { ALL_CATALOG_ITEMS } from '@/lib/eligibilityCatalog';

interface EligibilityChipProps {
  item: EligibilityItem;
  onRemove: () => void;
  onClick?: () => void;
}

export function EligibilityChip({ item, onRemove, onClick }: EligibilityChipProps) {
  const catalogItem = ALL_CATALOG_ITEMS.find(c => c.type === item.type);
  const icon = catalogItem?.icon || '🏷️';
  const label = getEligibilityDisplayLabel(item, ALL_CATALOG_ITEMS);

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-card/80 text-sm group hover:border-primary/30 transition-colors cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      <span className="text-base flex-shrink-0">{icon}</span>
      <span className="text-foreground truncate max-w-[200px] sm:max-w-[280px]">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex-shrink-0 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label={`Remove ${label}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
