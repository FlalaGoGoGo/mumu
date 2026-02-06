import { X } from 'lucide-react';
import { EligibilityItem } from '@/types/eligibility';
import { ALL_CATALOG_ITEMS } from '@/lib/eligibilityCatalog';

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

interface EligibilityChipProps {
  item: EligibilityItem;
  onRemove: () => void;
  onRemoveDetail?: (detailType: 'schools' | 'libraries' | 'companies', value: string) => void;
  onClick?: () => void;
}

export function EligibilityChip({ item, onRemove, onRemoveDetail, onClick }: EligibilityChipProps) {
  const catalogItem = ALL_CATALOG_ITEMS.find(c => c.type === item.type);
  const icon = catalogItem?.icon || '🏷️';
  const baseLabel = catalogItem?.label || item.type;

  const details: { type: 'schools' | 'libraries' | 'companies'; values: string[] }[] = [];
  if (item.schools?.length) details.push({ type: 'schools', values: item.schools });
  if (item.libraries?.length) details.push({ type: 'libraries', values: item.libraries });
  if (item.companies?.length) details.push({ type: 'companies', values: item.companies });

  const hasDetails = details.length > 0;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/60 bg-card/80 text-sm group hover:border-primary/30 transition-colors"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      <span className="text-base flex-shrink-0 self-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-foreground font-medium">{baseLabel}</span>
        {hasDetails && (
          <div className="mt-1 space-y-0.5">
            {details.map(detail =>
              detail.values.map(val => (
                <div key={`${detail.type}-${val}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  <span className="break-words">{val}</span>
                  {onRemoveDetail && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveDetail(detail.type, val);
                      }}
                      className="flex-shrink-0 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label={`Remove ${val}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {item.date_of_birth && (
          <div className="mt-1 text-xs text-muted-foreground">
            Age: {calculateAge(item.date_of_birth)}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex-shrink-0 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors self-center"
        aria-label={`Remove ${baseLabel}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
