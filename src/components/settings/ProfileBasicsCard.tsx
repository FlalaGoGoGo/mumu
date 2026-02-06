import { UserPreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { SUPPORTED_LANGUAGES, Language } from '@/lib/i18n/translations';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import { SingleSelectChips } from './PreferenceChip';
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

function SharedContent({ preferences, onUpdate }: ProfileBasicsCardProps) {
  const { t, setPreferredLanguage } = useLanguage();

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

  const handleLanguageChange = (langCode: string) => {
    // Update user preference (persistent)
    onUpdate({ language: langCode });
    // Also update active language immediately
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
        <SingleSelectChips
          options={KNOWLEDGE_LEVELS.map(k => t(k.labelKey))}
          selected={t(KNOWLEDGE_LEVELS.find(k => k.value === preferences.knowledge_level)?.labelKey || 'knowledge.beginner')}
          onChange={(label) => {
            const level = KNOWLEDGE_LEVELS.find(k => t(k.labelKey) === label);
            if (level) onUpdate({ knowledge_level: level.value });
          }}
        />
      </PreferenceField>

      <PreferenceField 
        label={t('settings.visitStyle')}
        description={t('settings.visitStyleDescription')}
      >
        <SingleSelectChips
          options={VISIT_STYLES.map(v => t(v.labelKey))}
          selected={t(VISIT_STYLES.find(v => v.value === preferences.visit_style)?.labelKey || 'visitStyle.efficientHighlights')}
          onChange={(label) => {
            const style = VISIT_STYLES.find(v => t(v.labelKey) === label);
            if (style) onUpdate({ visit_style: style.value });
          }}
        />
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
