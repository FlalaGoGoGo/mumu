import { X, AlertTriangle } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
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
  onRemoveDetail?: (detailType: 'schools' | 'libraries' | 'companies' | 'locations' | 'cities', value: string) => void;
  onRemoveMembership?: (museumId: string) => void;
  onClick?: () => void;
}

export function EligibilityChip({ item, onRemove, onRemoveDetail, onRemoveMembership, onClick }: EligibilityChipProps) {
  const catalogItem = ALL_CATALOG_ITEMS.find(c => c.type === item.type);
  const icon = catalogItem?.icon || '🏷️';
  const baseLabel = catalogItem?.label || item.type;

  const details: { type: 'schools' | 'libraries' | 'companies' | 'locations' | 'cities'; values: string[] }[] = [];
  if (item.schools?.length) details.push({ type: 'schools', values: item.schools });
  if (item.libraries?.length) details.push({ type: 'libraries', values: item.libraries });
  if (item.companies?.length) details.push({ type: 'companies', values: item.companies });
  if (item.cities?.length) details.push({ type: 'cities', values: item.cities });
  if (item.locations?.length) details.push({ type: 'locations', values: item.locations });

  const hasDetails = details.length > 0 || (item.museum_memberships?.length ?? 0) > 0;

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
      <span className="text-base flex-shrink-0 self-center leading-none">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-foreground font-medium">{baseLabel}</span>
        {details.length > 0 && (
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
        {/* Museum memberships */}
        {item.museum_memberships && item.museum_memberships.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {item.museum_memberships.map(m => {
              const expired = m.expires_on ? isBefore(new Date(m.expires_on), startOfDay(new Date())) : false;
              return (
                <div key={m.museum_id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  <span className="break-words flex-1">
                    {m.museum_name}
                    {m.expires_on && (
                      <span className={expired ? 'text-destructive ml-1' : 'ml-1'}>
                        · {expired ? 'Expired' : 'Exp.'} {format(new Date(m.expires_on), 'MM/dd/yyyy')}
                      </span>
                    )}
                  </span>
                  {expired && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                  {onRemoveMembership && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMembership(m.museum_id);
                      }}
                      className="flex-shrink-0 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label={`Remove ${m.museum_name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
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
