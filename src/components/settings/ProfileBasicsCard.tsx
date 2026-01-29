import { UserPreferences } from '@/hooks/usePreferences';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import { SingleSelectChips } from './PreferenceChip';

const LANGUAGES = [
  'English',
  'Simplified Chinese',
  'Traditional Chinese',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Portuguese',
  'Italian',
];

const KNOWLEDGE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const VISIT_STYLES = [
  'Efficient Highlights',
  'Story Immersion',
  'Deep Learning',
];

interface ProfileBasicsCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export function ProfileBasicsCard({ preferences, onUpdate }: ProfileBasicsCardProps) {
  return (
    <PreferenceCard title="Profile Basics">
      <PreferenceField 
        label="Preferred Language"
        description="Display language for museum content"
      >
        <SingleSelectChips
          options={LANGUAGES}
          selected={preferences.language}
          onChange={(language) => onUpdate({ language })}
        />
      </PreferenceField>

      <PreferenceField 
        label="Art Knowledge Level"
        description="We'll tailor content depth to your experience"
      >
        <SingleSelectChips
          options={KNOWLEDGE_LEVELS}
          selected={preferences.knowledge_level}
          onChange={(knowledge_level) => onUpdate({ knowledge_level })}
        />
      </PreferenceField>

      <PreferenceField 
        label="Default Visit Style"
        description="How you prefer to explore museums"
      >
        <SingleSelectChips
          options={VISIT_STYLES}
          selected={preferences.visit_style}
          onChange={(visit_style) => onUpdate({ visit_style })}
        />
      </PreferenceField>
    </PreferenceCard>
  );
}

// For accordion use
export function ProfileBasicsContent({ preferences, onUpdate }: ProfileBasicsCardProps) {
  return (
    <div className="space-y-6 py-2">
      <PreferenceField 
        label="Preferred Language"
        description="Display language for museum content"
      >
        <SingleSelectChips
          options={LANGUAGES}
          selected={preferences.language}
          onChange={(language) => onUpdate({ language })}
        />
      </PreferenceField>

      <PreferenceField 
        label="Art Knowledge Level"
        description="We'll tailor content depth to your experience"
      >
        <SingleSelectChips
          options={KNOWLEDGE_LEVELS}
          selected={preferences.knowledge_level}
          onChange={(knowledge_level) => onUpdate({ knowledge_level })}
        />
      </PreferenceField>

      <PreferenceField 
        label="Default Visit Style"
        description="How you prefer to explore museums"
      >
        <SingleSelectChips
          options={VISIT_STYLES}
          selected={preferences.visit_style}
          onChange={(visit_style) => onUpdate({ visit_style })}
        />
      </PreferenceField>
    </div>
  );
}
