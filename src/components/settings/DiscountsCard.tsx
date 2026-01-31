import { UserPreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import { MultiSelectChips } from './PreferenceChip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DiscountsCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export function DiscountsCard({ preferences, onUpdate }: DiscountsCardProps) {
  const { t } = useLanguage();

  const DISCOUNT_OPTIONS = [
    { value: 'Student (valid ID)', labelKey: 'discount.student' as const },
    { value: 'Bank of America (Museums on Us)', labelKey: 'discount.bankOfAmerica' as const },
    { value: 'ICOM Member', labelKey: 'discount.icom' as const },
    { value: 'Museums for All', labelKey: 'discount.museumsForAll' as const },
    { value: 'Military (active/veteran)', labelKey: 'discount.military' as const },
    { value: 'None / Not sure', labelKey: 'discount.none' as const },
  ];

  const selectedDiscountLabels = preferences.discounts.map(discount => {
    const option = DISCOUNT_OPTIONS.find(o => o.value === discount);
    return option ? t(option.labelKey) : discount;
  });

  const noneLabel = t('discount.none');

  return (
    <PreferenceCard title={t('settings.discounts')}>
      <PreferenceField 
        label={t('settings.yourEligibility')}
        description={t('settings.eligibilityDescription')}
      >
        <MultiSelectChips
          options={DISCOUNT_OPTIONS.map(o => t(o.labelKey))}
          selected={selectedDiscountLabels}
          onChange={(labels) => {
            const values = labels.map(label => {
              const option = DISCOUNT_OPTIONS.find(o => t(o.labelKey) === label);
              return option?.value || label;
            });
            onUpdate({ discounts: values });
          }}
          exclusiveOption={noneLabel}
        />
      </PreferenceField>

      <p className="text-xs text-muted-foreground italic">
        {t('settings.discountNote')}
      </p>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="eligible-only" className="text-sm cursor-pointer">
              {t('settings.showEligibleOnly')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('settings.hideNonEligible')}
            </p>
          </div>
          <Switch
            id="eligible-only"
            checked={preferences.show_eligible_discounts_only}
            onCheckedChange={(show_eligible_discounts_only) => onUpdate({ show_eligible_discounts_only })}
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
    </PreferenceCard>
  );
}

// For accordion use
export function DiscountsContent({ preferences, onUpdate }: DiscountsCardProps) {
  const { t } = useLanguage();

  const DISCOUNT_OPTIONS = [
    { value: 'Student (valid ID)', labelKey: 'discount.student' as const },
    { value: 'Bank of America (Museums on Us)', labelKey: 'discount.bankOfAmerica' as const },
    { value: 'ICOM Member', labelKey: 'discount.icom' as const },
    { value: 'Museums for All', labelKey: 'discount.museumsForAll' as const },
    { value: 'Military (active/veteran)', labelKey: 'discount.military' as const },
    { value: 'None / Not sure', labelKey: 'discount.none' as const },
  ];

  const selectedDiscountLabels = preferences.discounts.map(discount => {
    const option = DISCOUNT_OPTIONS.find(o => o.value === discount);
    return option ? t(option.labelKey) : discount;
  });

  const noneLabel = t('discount.none');

  return (
    <div className="space-y-6 py-2">
      <PreferenceField 
        label={t('settings.yourEligibility')}
        description={t('settings.eligibilityDescription')}
      >
        <MultiSelectChips
          options={DISCOUNT_OPTIONS.map(o => t(o.labelKey))}
          selected={selectedDiscountLabels}
          onChange={(labels) => {
            const values = labels.map(label => {
              const option = DISCOUNT_OPTIONS.find(o => t(o.labelKey) === label);
              return option?.value || label;
            });
            onUpdate({ discounts: values });
          }}
          exclusiveOption={noneLabel}
        />
      </PreferenceField>

      <p className="text-xs text-muted-foreground italic">
        {t('settings.discountNote')}
      </p>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="eligible-only-mobile" className="text-sm cursor-pointer">
              {t('settings.showEligibleOnly')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('settings.hideNonEligible')}
            </p>
          </div>
          <Switch
            id="eligible-only-mobile"
            checked={preferences.show_eligible_discounts_only}
            onCheckedChange={(show_eligible_discounts_only) => onUpdate({ show_eligible_discounts_only })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="free-days-mobile" className="text-sm cursor-pointer">
              {t('settings.remindFreeDays')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t('settings.freeDaysDescription')}
            </p>
          </div>
          <Switch
            id="free-days-mobile"
            checked={preferences.remind_free_days}
            onCheckedChange={(remind_free_days) => onUpdate({ remind_free_days })}
          />
        </div>
      </div>
    </div>
  );
}
