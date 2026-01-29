import { UserPreferences } from '@/hooks/usePreferences';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import { MultiSelectChips, SingleSelectChips } from './PreferenceChip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const INTEREST_OPTIONS = [
  'Impressionism',
  'Modern Art',
  'Asian Art',
  'European Paintings',
  'American Art',
  'Sculpture',
  'Photography',
  'Architecture',
  'Surprise me',
];

const PACE_OPTIONS = ['Slow & chill', 'Normal', 'Fast'];

interface InterestsCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export function InterestsCard({ preferences, onUpdate }: InterestsCardProps) {
  return (
    <PreferenceCard title="Interests & Content Preferences" className="md:col-span-2">
      <PreferenceField 
        label="Favorite Topics"
        description="Select the art categories that interest you most"
      >
        <MultiSelectChips
          options={INTEREST_OPTIONS}
          selected={preferences.interests}
          onChange={(interests) => onUpdate({ interests })}
        />
      </PreferenceField>

      <PreferenceField 
        label="Default Pace Preference"
        description="How quickly you like to move through exhibitions"
      >
        <SingleSelectChips
          options={PACE_OPTIONS}
          selected={preferences.pace_preference}
          onChange={(pace_preference) => onUpdate({ pace_preference })}
        />
      </PreferenceField>

      <div className="pt-2 space-y-4">
        <p className="text-sm font-medium text-foreground">Comfort Options</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="less-walking" className="text-sm text-muted-foreground cursor-pointer">
              Prefer less walking
            </Label>
            <Switch
              id="less-walking"
              checked={preferences.prefer_less_walking}
              onCheckedChange={(prefer_less_walking) => onUpdate({ prefer_less_walking })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="elevator" className="text-sm text-muted-foreground cursor-pointer">
              Prefer elevator / avoid stairs
            </Label>
            <Switch
              id="elevator"
              checked={preferences.prefer_elevator}
              onCheckedChange={(prefer_elevator) => onUpdate({ prefer_elevator })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="kid-friendly" className="text-sm text-muted-foreground cursor-pointer">
              Kid-friendly content
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
  return (
    <div className="space-y-6 py-2">
      <PreferenceField 
        label="Favorite Topics"
        description="Select the art categories that interest you most"
      >
        <MultiSelectChips
          options={INTEREST_OPTIONS}
          selected={preferences.interests}
          onChange={(interests) => onUpdate({ interests })}
        />
      </PreferenceField>

      <PreferenceField 
        label="Default Pace Preference"
        description="How quickly you like to move through exhibitions"
      >
        <SingleSelectChips
          options={PACE_OPTIONS}
          selected={preferences.pace_preference}
          onChange={(pace_preference) => onUpdate({ pace_preference })}
        />
      </PreferenceField>

      <div className="pt-2 space-y-4">
        <p className="text-sm font-medium text-foreground">Comfort Options</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="less-walking-mobile" className="text-sm text-muted-foreground cursor-pointer">
              Prefer less walking
            </Label>
            <Switch
              id="less-walking-mobile"
              checked={preferences.prefer_less_walking}
              onCheckedChange={(prefer_less_walking) => onUpdate({ prefer_less_walking })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="elevator-mobile" className="text-sm text-muted-foreground cursor-pointer">
              Prefer elevator / avoid stairs
            </Label>
            <Switch
              id="elevator-mobile"
              checked={preferences.prefer_elevator}
              onCheckedChange={(prefer_elevator) => onUpdate({ prefer_elevator })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="kid-friendly-mobile" className="text-sm text-muted-foreground cursor-pointer">
              Kid-friendly content
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
