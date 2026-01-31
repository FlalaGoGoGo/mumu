import { UserPreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import { MultiSelectChips, SingleSelectChips } from './PreferenceChip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface InterestsCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export function InterestsCard({ preferences, onUpdate }: InterestsCardProps) {
  const { t } = useLanguage();

  const INTEREST_OPTIONS = [
    { value: 'Impressionism', labelKey: 'interest.impressionism' as const },
    { value: 'Modern Art', labelKey: 'interest.modernArt' as const },
    { value: 'Asian Art', labelKey: 'interest.asianArt' as const },
    { value: 'European Paintings', labelKey: 'interest.europeanPaintings' as const },
    { value: 'American Art', labelKey: 'interest.americanArt' as const },
    { value: 'Sculpture', labelKey: 'interest.sculpture' as const },
    { value: 'Photography', labelKey: 'interest.photography' as const },
    { value: 'Architecture', labelKey: 'interest.architecture' as const },
    { value: 'Surprise me', labelKey: 'interest.surpriseMe' as const },
  ];

  const PACE_OPTIONS = [
    { value: 'Slow & chill', labelKey: 'pace.slow' as const },
    { value: 'Normal', labelKey: 'pace.normal' as const },
    { value: 'Fast', labelKey: 'pace.fast' as const },
  ];

  // Map stored values to display labels
  const selectedInterestLabels = preferences.interests.map(interest => {
    const option = INTEREST_OPTIONS.find(o => o.value === interest);
    return option ? t(option.labelKey) : interest;
  });

  const selectedPaceLabel = t(PACE_OPTIONS.find(p => p.value === preferences.pace_preference)?.labelKey || 'pace.normal');

  return (
    <PreferenceCard title={t('settings.interestsTitle')} className="md:col-span-2">
      <PreferenceField 
        label={t('settings.favoriteTopics')}
        description={t('settings.favoriteTopicsDescription')}
      >
        <MultiSelectChips
          options={INTEREST_OPTIONS.map(o => t(o.labelKey))}
          selected={selectedInterestLabels}
          onChange={(labels) => {
            const values = labels.map(label => {
              const option = INTEREST_OPTIONS.find(o => t(o.labelKey) === label);
              return option?.value || label;
            });
            onUpdate({ interests: values });
          }}
        />
      </PreferenceField>

      <PreferenceField 
        label={t('settings.pacePreference')}
        description={t('settings.paceDescription')}
      >
        <SingleSelectChips
          options={PACE_OPTIONS.map(p => t(p.labelKey))}
          selected={selectedPaceLabel}
          onChange={(label) => {
            const pace = PACE_OPTIONS.find(p => t(p.labelKey) === label);
            if (pace) onUpdate({ pace_preference: pace.value });
          }}
        />
      </PreferenceField>

      <div className="pt-2 space-y-4">
        <p className="text-sm font-medium text-foreground">{t('settings.comfortOptions')}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="less-walking" className="text-sm text-muted-foreground cursor-pointer">
              {t('settings.lessWalking')}
            </Label>
            <Switch
              id="less-walking"
              checked={preferences.prefer_less_walking}
              onCheckedChange={(prefer_less_walking) => onUpdate({ prefer_less_walking })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="elevator" className="text-sm text-muted-foreground cursor-pointer">
              {t('settings.elevator')}
            </Label>
            <Switch
              id="elevator"
              checked={preferences.prefer_elevator}
              onCheckedChange={(prefer_elevator) => onUpdate({ prefer_elevator })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="kid-friendly" className="text-sm text-muted-foreground cursor-pointer">
              {t('settings.kidFriendly')}
            </Label>
            <Switch
              id="kid-friendly"
              checked={preferences.kid_friendly_content}
              onCheckedChange={(kid_friendly_content) => onUpdate({ kid_friendly_content })}
            />
          </div>
        </div>
      </div>
    </PreferenceCard>
  );
}

// For accordion use
export function InterestsContent({ preferences, onUpdate }: InterestsCardProps) {
  const { t } = useLanguage();

  const INTEREST_OPTIONS = [
    { value: 'Impressionism', labelKey: 'interest.impressionism' as const },
    { value: 'Modern Art', labelKey: 'interest.modernArt' as const },
    { value: 'Asian Art', labelKey: 'interest.asianArt' as const },
    { value: 'European Paintings', labelKey: 'interest.europeanPaintings' as const },
    { value: 'American Art', labelKey: 'interest.americanArt' as const },
    { value: 'Sculpture', labelKey: 'interest.sculpture' as const },
    { value: 'Photography', labelKey: 'interest.photography' as const },
    { value: 'Architecture', labelKey: 'interest.architecture' as const },
    { value: 'Surprise me', labelKey: 'interest.surpriseMe' as const },
  ];

  const PACE_OPTIONS = [
    { value: 'Slow & chill', labelKey: 'pace.slow' as const },
    { value: 'Normal', labelKey: 'pace.normal' as const },
    { value: 'Fast', labelKey: 'pace.fast' as const },
  ];

  const selectedInterestLabels = preferences.interests.map(interest => {
    const option = INTEREST_OPTIONS.find(o => o.value === interest);
    return option ? t(option.labelKey) : interest;
  });

  const selectedPaceLabel = t(PACE_OPTIONS.find(p => p.value === preferences.pace_preference)?.labelKey || 'pace.normal');

  return (
    <div className="space-y-6 py-2">
      <PreferenceField 
        label={t('settings.favoriteTopics')}
        description={t('settings.favoriteTopicsDescription')}
      >
        <MultiSelectChips
          options={INTEREST_OPTIONS.map(o => t(o.labelKey))}
          selected={selectedInterestLabels}
          onChange={(labels) => {
            const values = labels.map(label => {
              const option = INTEREST_OPTIONS.find(o => t(o.labelKey) === label);
              return option?.value || label;
            });
            onUpdate({ interests: values });
          }}
        />
      </PreferenceField>

      <PreferenceField 
        label={t('settings.pacePreference')}
        description={t('settings.paceDescription')}
      >
        <SingleSelectChips
          options={PACE_OPTIONS.map(p => t(p.labelKey))}
          selected={selectedPaceLabel}
          onChange={(label) => {
            const pace = PACE_OPTIONS.find(p => t(p.labelKey) === label);
            if (pace) onUpdate({ pace_preference: pace.value });
          }}
        />
      </PreferenceField>

      <div className="pt-2 space-y-4">
        <p className="text-sm font-medium text-foreground">{t('settings.comfortOptions')}</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="less-walking-mobile" className="text-sm text-muted-foreground cursor-pointer">
              {t('settings.lessWalking')}
            </Label>
            <Switch
              id="less-walking-mobile"
              checked={preferences.prefer_less_walking}
              onCheckedChange={(prefer_less_walking) => onUpdate({ prefer_less_walking })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="elevator-mobile" className="text-sm text-muted-foreground cursor-pointer">
              {t('settings.elevator')}
            </Label>
            <Switch
              id="elevator-mobile"
              checked={preferences.prefer_elevator}
              onCheckedChange={(prefer_elevator) => onUpdate({ prefer_elevator })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="kid-friendly-mobile" className="text-sm text-muted-foreground cursor-pointer">
              {t('settings.kidFriendly')}
            </Label>
            <Switch
              id="kid-friendly-mobile"
              checked={preferences.kid_friendly_content}
              onCheckedChange={(kid_friendly_content) => onUpdate({ kid_friendly_content })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
