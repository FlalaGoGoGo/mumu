import { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { UserPreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { EligibilityChip } from './eligibility/EligibilityChip';
import { AddEligibilityDialog } from './eligibility/AddEligibilityDialog';
import {
  EligibilityItem,
  deserializeEligibilities,
  serializeEligibilities,
} from '@/types/eligibility';

interface DiscountsCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

function useEligibilityManager(preferences: UserPreferences, onUpdate: (updates: Partial<UserPreferences>) => void) {
  const eligibilities = useMemo(
    () => deserializeEligibilities(preferences.discounts),
    [preferences.discounts]
  );

  const setEligibilities = useCallback(
    (items: EligibilityItem[]) => {
      onUpdate({ discounts: serializeEligibilities(items) });
    },
    [onUpdate]
  );

  const addEligibility = useCallback(
    (item: EligibilityItem) => {
      const existing = deserializeEligibilities(preferences.discounts);
      if (!existing.find(e => e.type === item.type)) {
        setEligibilities([...existing, item]);
      }
    },
    [preferences.discounts, setEligibilities]
  );

  const updateEligibility = useCallback(
    (item: EligibilityItem) => {
      const existing = deserializeEligibilities(preferences.discounts);
      setEligibilities(existing.map(e => (e.type === item.type ? item : e)));
    },
    [preferences.discounts, setEligibilities]
  );

  const removeEligibility = useCallback(
    (type: string) => {
      const existing = deserializeEligibilities(preferences.discounts);
      setEligibilities(existing.filter(e => e.type !== type));
    },
    [preferences.discounts, setEligibilities]
  );

  const removeDetail = useCallback(
    (type: string, detailType: 'schools' | 'libraries' | 'companies' | 'locations', value: string) => {
      const existing = deserializeEligibilities(preferences.discounts);
      const updated = existing.map(e => {
        if (e.type !== type) return e;
        const arr = e[detailType];
        if (!arr) return e;
        const filtered = arr.filter(v => v !== value);
        return { ...e, [detailType]: filtered };
      });
      setEligibilities(updated);
    },
    [preferences.discounts, setEligibilities]
  );

  return { eligibilities, addEligibility, updateEligibility, removeEligibility, removeDetail };
}

function EligibilitySection({ preferences, onUpdate }: DiscountsCardProps) {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { eligibilities, addEligibility, updateEligibility, removeEligibility, removeDetail } = useEligibilityManager(preferences, onUpdate);

  return (
    <>
      <PreferenceField
        label={t('settings.yourEligibility')}
        description={t('settings.eligibilityDescription')}
      >
        {/* Selected eligibilities as vertical list */}
        {eligibilities.length > 0 ? (
          <div className="space-y-2">
            {eligibilities.map(item => (
              <EligibilityChip
                key={item.type}
                item={item}
                onRemove={() => removeEligibility(item.type)}
                onRemoveDetail={(detailType, value) => removeDetail(item.type, detailType, value)}
                onClick={() => setDialogOpen(true)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic py-2">
            Add your passes or programs to unlock discounts.
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="mt-2 border-primary/30 text-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add eligibility
        </Button>
      </PreferenceField>

      <AddEligibilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eligibilities={eligibilities}
        onAdd={addEligibility}
        onUpdate={updateEligibility}
      />
    </>
  );
}

function DiscountToggles({ preferences, onUpdate }: DiscountsCardProps) {
  const { t } = useLanguage();
  const eligibilities = useMemo(
    () => deserializeEligibilities(preferences.discounts),
    [preferences.discounts]
  );

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="eligible-only" className="text-sm cursor-pointer">
            {t('settings.showEligibleOnly')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {eligibilities.length === 0
              ? 'Add eligibilities first to filter discounts'
              : t('settings.hideNonEligible')}
          </p>
        </div>
        <Switch
          id="eligible-only"
          checked={preferences.show_eligible_discounts_only}
          onCheckedChange={(show_eligible_discounts_only) =>
            onUpdate({ show_eligible_discounts_only })
          }
          disabled={eligibilities.length === 0}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="free-days" className="text-sm cursor-pointer">
            {t('settings.remindFreeDays')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('settings.freeDaysDescription')}
          </p>
        </div>
        <Switch
          id="free-days"
          checked={preferences.remind_free_days}
          onCheckedChange={(remind_free_days) => onUpdate({ remind_free_days })}
        />
      </div>
    </div>
  );
}

export function DiscountsCard({ preferences, onUpdate }: DiscountsCardProps) {
  const { t } = useLanguage();

  return (
    <PreferenceCard title={t('settings.discounts')}>
      <EligibilitySection preferences={preferences} onUpdate={onUpdate} />
      <DiscountToggles preferences={preferences} onUpdate={onUpdate} />
    </PreferenceCard>
  );
}

// For mobile accordion
export function DiscountsContent({ preferences, onUpdate }: DiscountsCardProps) {
  return (
    <div className="space-y-6 py-2">
      <EligibilitySection preferences={preferences} onUpdate={onUpdate} />
      <DiscountToggles preferences={preferences} onUpdate={onUpdate} />
    </div>
  );
}
