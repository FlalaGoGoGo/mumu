import { UserPreferences } from '@/hooks/usePreferences';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import { MultiSelectChips } from './PreferenceChip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const DISCOUNT_OPTIONS = [
  'Student (valid ID)',
  'Bank of America (Museums on Us)',
  'ICOM Member',
  'Museums for All',
  'Military (active/veteran)',
  'None / Not sure',
];

interface DiscountsCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export function DiscountsCard({ preferences, onUpdate }: DiscountsCardProps) {
  return (
    <PreferenceCard title="Discounts & Eligibility">
      <PreferenceField 
        label="Your Eligibility"
        description="Select all that may apply — we'll show relevant discounts"
      >
        <MultiSelectChips
          options={DISCOUNT_OPTIONS}
          selected={preferences.discounts}
          onChange={(discounts) => onUpdate({ discounts })}
          exclusiveOption="None / Not sure"
        />
      </PreferenceField>

      <p className="text-xs text-muted-foreground italic">
        Discount availability varies by museum. You may be eligible for these savings.
      </p>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="eligible-only" className="text-sm cursor-pointer">
              Only show discounts I'm eligible for
            </Label>
            <p className="text-xs text-muted-foreground">
              Hide discounts you haven't selected above
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
              Remind me about free days
            </Label>
            <p className="text-xs text-muted-foreground">
              Get notified when museums offer free admission
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
  return (
    <div className="space-y-6 py-2">
      <PreferenceField 
        label="Your Eligibility"
        description="Select all that may apply — we'll show relevant discounts"
      >
        <MultiSelectChips
          options={DISCOUNT_OPTIONS}
          selected={preferences.discounts}
          onChange={(discounts) => onUpdate({ discounts })}
          exclusiveOption="None / Not sure"
        />
      </PreferenceField>

      <p className="text-xs text-muted-foreground italic">
        Discount availability varies by museum. You may be eligible for these savings.
      </p>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="eligible-only-mobile" className="text-sm cursor-pointer">
              Only show discounts I'm eligible for
            </Label>
            <p className="text-xs text-muted-foreground">
              Hide discounts you haven't selected
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
              Remind me about free days
            </Label>
            <p className="text-xs text-muted-foreground">
              Get notified about free admission
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
