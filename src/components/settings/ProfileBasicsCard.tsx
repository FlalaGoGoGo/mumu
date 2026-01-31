import { UserPreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import { SingleSelectChips } from './PreferenceChip';

interface ProfileBasicsCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export function ProfileBasicsCard({ preferences, onUpdate }: ProfileBasicsCardProps) {
  const { t } = useLanguage();

  const LANGUAGES = [
    { value: 'English', label: 'English' },
    { value: 'Simplified Chinese', label: '简体中文' },
    { value: 'Traditional Chinese', label: '繁體中文' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Français' },
    { value: 'German', label: 'Deutsch' },
    { value: 'Japanese', label: '日本語' },
    { value: 'Korean', label: '한국어' },
    { value: 'Portuguese', label: 'Português' },
    { value: 'Italian', label: 'Italiano' },
  ];

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

  return (
    <PreferenceCard title={t('settings.profileBasics')}>
      <PreferenceField 
        label={t('settings.preferredLanguage')}
        description={t('settings.languageDescription')}
      >
        <SingleSelectChips
          options={LANGUAGES.map(l => l.label)}
          selected={LANGUAGES.find(l => l.value === preferences.language)?.label || 'English'}
          onChange={(label) => {
            const lang = LANGUAGES.find(l => l.label === label);
            if (lang) onUpdate({ language: lang.value });
          }}
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
    </PreferenceCard>
  );
}

// For accordion use
export function ProfileBasicsContent({ preferences, onUpdate }: ProfileBasicsCardProps) {
  const { t } = useLanguage();

  const LANGUAGES = [
    { value: 'English', label: 'English' },
    { value: 'Simplified Chinese', label: '简体中文' },
    { value: 'Traditional Chinese', label: '繁體中文' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Français' },
    { value: 'German', label: 'Deutsch' },
    { value: 'Japanese', label: '日本語' },
    { value: 'Korean', label: '한국어' },
    { value: 'Portuguese', label: 'Português' },
    { value: 'Italian', label: 'Italiano' },
  ];

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

  return (
    <div className="space-y-6 py-2">
      <PreferenceField 
        label={t('settings.preferredLanguage')}
        description={t('settings.languageDescription')}
      >
        <SingleSelectChips
          options={LANGUAGES.map(l => l.label)}
          selected={LANGUAGES.find(l => l.value === preferences.language)?.label || 'English'}
          onChange={(label) => {
            const lang = LANGUAGES.find(l => l.label === label);
            if (lang) onUpdate({ language: lang.value });
          }}
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
    </div>
  );
}
