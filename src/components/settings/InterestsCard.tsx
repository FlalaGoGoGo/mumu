import { useState, useRef, useEffect } from 'react';
import { UserPreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { PreferenceCard, PreferenceField } from './PreferenceCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface InterestsCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

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

function TopicMultiSelect({
  selectedValues,
  onChange,
}: {
  selectedValues: string[];
  onChange: (values: string[]) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = INTEREST_OPTIONS.filter(opt => {
    const label = t(opt.labelKey).toLowerCase();
    return label.includes(search.toLowerCase());
  });

  const toggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t('settings.addTopic')}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-64 p-0 bg-popover z-[9999]" 
            align="start"
            sideOffset={4}
          >
            <div className="p-2 border-b border-border/40">
              <Input
                placeholder={t('settings.searchTopics')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-[240px] overflow-y-auto p-1">
              {filteredOptions.map(opt => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(opt.value)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  >
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                      isSelected ? 'bg-primary border-primary' : 'border-input'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span>{t(opt.labelKey)}</span>
                  </button>
                );
              })}
              {filteredOptions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">{t('common.noResults')}</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected chips */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedValues.map(value => {
            const opt = INTEREST_OPTIONS.find(o => o.value === value);
            const label = opt ? t(opt.labelKey) : value;
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {label}
                <button
                  type="button"
                  onClick={() => onChange(selectedValues.filter(v => v !== value))}
                  className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SharedInterestsContent({ preferences, onUpdate }: InterestsCardProps) {
  const { t } = useLanguage();

  return (
    <>
      <PreferenceField 
        label={t('settings.favoriteTopics')}
        description={t('settings.favoriteTopicsDescription')}
      >
        <TopicMultiSelect
          selectedValues={preferences.interests}
          onChange={(interests) => onUpdate({ interests })}
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
    </>
  );
}

export function InterestsCard({ preferences, onUpdate }: InterestsCardProps) {
  const { t } = useLanguage();

  return (
    <PreferenceCard title={t('settings.interestsTitle')}>
      <SharedInterestsContent preferences={preferences} onUpdate={onUpdate} />
    </PreferenceCard>
  );
}

// For accordion use
export function InterestsContent({ preferences, onUpdate }: InterestsCardProps) {
  return (
    <div className="space-y-6 py-2">
      <SharedInterestsContent preferences={preferences} onUpdate={onUpdate} />
    </div>
  );
}
