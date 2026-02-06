import { UserPreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { SUPPORTED_LANGUAGES, Language } from '@/lib/i18n/translations';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProfileBasicsCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

function LanguageDropdown({ value, onChange }: { value: string; onChange: (lang: string) => void }) {
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full min-h-[44px] px-4 gap-2 bg-background">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{currentLang?.flag}</span>
            <span>{currentLang?.nativeLabel}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-popover z-[9999]" position="popper" sideOffset={4}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.nativeLabel}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const KNOWLEDGE_LEVELS = [
  { value: 'Beginner', labelKey: 'knowledge.beginner' as const },
  { value: 'Intermediate', labelKey: 'knowledge.intermediate' as const },
  { value: 'Advanced', labelKey: 'knowledge.advanced' as const },
];

const VISIT_STYLES = [
  { value: 'Efficient Highlights', labelKey: 'visitStyle.efficientHighlights' as const },
  { value: 'Story Immersion', labelKey: 'visitStyle.storyImmersion' as const },
  { value: 'Deep Learning', labelKey: 'visitStyle.deepLearning' as const },
];

const PACE_OPTIONS = [
  { value: 'Slow & chill', labelKey: 'pace.slow' as const },
  { value: 'Normal', labelKey: 'pace.normal' as const },
  { value: 'Fast', labelKey: 'pace.fast' as const },
];

function SharedContent({ preferences, onUpdate }: ProfileBasicsCardProps) {
  const { t, setPreferredLanguage } = useLanguage();

  const handleLanguageChange = (langCode: string) => {
    onUpdate({ language: langCode });
    setPreferredLanguage(langCode as Language);
  };

  return (
    <>
      <PreferenceField 
        label={t('settings.preferredLanguage')}
        description={t('settings.languageDescription')}
      >
        <LanguageDropdown
          value={preferences.language}
          onChange={handleLanguageChange}
        />
      </PreferenceField>

      <PreferenceField 
        label={t('settings.knowledgeLevel')}
        description={t('settings.knowledgeDescription')}
      >
        <Select
          value={preferences.knowledge_level}
          onValueChange={(val) => onUpdate({ knowledge_level: val })}
        >
          <SelectTrigger className="w-full min-h-[40px] bg-background text-sm">
            <SelectValue>
              {t(KNOWLEDGE_LEVELS.find(k => k.value === preferences.knowledge_level)?.labelKey || 'knowledge.beginner')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover z-[9999]" position="popper" sideOffset={4}>
            {KNOWLEDGE_LEVELS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {t(k.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PreferenceField>

      <PreferenceField 
        label={t('settings.visitStyle')}
        description={t('settings.visitStyleDescription')}
      >
        <Select
          value={preferences.visit_style}
          onValueChange={(val) => onUpdate({ visit_style: val })}
        >
          <SelectTrigger className="w-full min-h-[40px] bg-background text-sm">
            <SelectValue>
              {t(VISIT_STYLES.find(v => v.value === preferences.visit_style)?.labelKey || 'visitStyle.efficientHighlights')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover z-[9999]" position="popper" sideOffset={4}>
            {VISIT_STYLES.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {t(v.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PreferenceField>

      <PreferenceField 
        label={t('settings.pacePreference')}
        description={t('settings.paceDescription')}
      >
        <Select
          value={preferences.pace_preference}
          onValueChange={(val) => onUpdate({ pace_preference: val })}
        >
          <SelectTrigger className="w-full min-h-[40px] bg-background text-sm">
            <SelectValue>
              {t(PACE_OPTIONS.find(p => p.value === preferences.pace_preference)?.labelKey || 'pace.normal')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover z-[9999]" position="popper" sideOffset={4}>
            {PACE_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {t(p.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PreferenceField>
    </>
  );
}

export function ProfileBasicsCard({ preferences, onUpdate }: ProfileBasicsCardProps) {
  const { t } = useLanguage();

  return (
    <PreferenceCard title={t('settings.profileBasics')}>
      <SharedContent preferences={preferences} onUpdate={onUpdate} />
    </PreferenceCard>
  );
}

// For accordion use
export function ProfileBasicsContent({ preferences, onUpdate }: ProfileBasicsCardProps) {
  return (
    <div className="space-y-6 py-2">
      <SharedContent preferences={preferences} onUpdate={onUpdate} />
    </div>
  );
}
