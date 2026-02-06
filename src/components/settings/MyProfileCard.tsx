import { useState } from 'react';
import { UserPreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import mumuLogo from '@/assets/mumu-logo.png';
import { toast } from '@/hooks/use-toast';
import { ProfileRow } from './profile/ProfileRow';
import { AvatarEditDialog } from './profile/AvatarEditDialog';
import { LocationEditDialog } from './profile/LocationEditDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MyProfileCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

function getInitials(nickname: string): string {
  if (!nickname.trim()) return '?';
  return nickname.trim().charAt(0).toUpperCase();
}

/** Display location as City, State/Province, Region */
function formatLocation(country: string, region: string, city: string): string {
  return [city, region, country].filter(Boolean).join(', ');
}

const PRONOUN_OPTIONS = [
  { value: 'He/Him', labelKey: 'profile.heHim' as const },
  { value: 'She/Her', labelKey: 'profile.sheHer' as const },
  { value: 'They/Them', labelKey: 'profile.theyThem' as const },
  { value: 'Use my name only', labelKey: 'profile.useMyName' as const },
  { value: 'Prefer not to say', labelKey: 'profile.preferNotToSay' as const },
  { value: 'Custom', labelKey: 'profile.customPronouns' as const },
];

// Shared profile editing logic
function useProfileEditing(preferences: MyProfileCardProps['preferences'], onUpdate: MyProfileCardProps['onUpdate']) {
  const { t } = useLanguage();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');
  const [editingPronouns, setEditingPronouns] = useState(false);
  const [customPronounValue, setCustomPronounValue] = useState('');

  const nickname = preferences.nickname || '';
  const avatarUrl = preferences.avatar_url || '';
  const pronouns = preferences.gender || '';
  const locationStr = formatLocation(
    preferences.location_country || '',
    preferences.location_region || '',
    preferences.location_city || ''
  );

  const isCustomPronoun = pronouns && !PRONOUN_OPTIONS.some(p => p.value === pronouns);
  
  const pronounsLabel = pronouns
    ? (isCustomPronoun
        ? pronouns
        : PRONOUN_OPTIONS.find(p => p.value === pronouns)
          ? t(PRONOUN_OPTIONS.find(p => p.value === pronouns)!.labelKey)
          : pronouns)
    : '';

  const startEditNickname = () => {
    setNicknameValue(nickname);
    setEditingNickname(true);
  };

  const saveNickname = () => {
    const trimmed = nicknameValue.trim();
    if (trimmed.length > 20) {
      toast({ title: t('profile.nicknameTooLong'), variant: 'destructive' });
      return;
    }
    onUpdate({ nickname: trimmed });
    setEditingNickname(false);
    toast({ title: t('profile.profileUpdated') });
  };

  const startEditPronouns = () => {
    if (isCustomPronoun) {
      setCustomPronounValue(pronouns);
    } else {
      setCustomPronounValue('');
    }
    setEditingPronouns(true);
  };

  return {
    t,
    avatarDialogOpen, setAvatarDialogOpen,
    locationDialogOpen, setLocationDialogOpen,
    editingNickname, setEditingNickname,
    nicknameValue, setNicknameValue,
    editingPronouns, setEditingPronouns,
    customPronounValue, setCustomPronounValue,
    nickname, avatarUrl, pronouns, locationStr, pronounsLabel,
    isCustomPronoun,
    startEditNickname, saveNickname, startEditPronouns,
  };
}

// Avatar with hover overlay
function AvatarWithOverlay({
  avatarUrl,
  nickname,
  size = 'lg',
  onClick,
}: {
  avatarUrl: string;
  nickname: string;
  size?: 'sm' | 'lg';
  onClick: () => void;
}) {
  const sizeClasses = size === 'lg' ? 'w-20 h-20' : 'w-16 h-16';
  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const textSize = size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <button onClick={onClick} className="group relative flex-shrink-0">
      <Avatar className={`${sizeClasses} border-2 border-border`}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={nickname || 'Avatar'} />
        ) : null}
        <AvatarFallback className="bg-muted overflow-hidden p-0">
          <img
            src={mumuLogo}
            alt="MuMu"
            className="w-[115%] h-[115%] object-cover object-center"
          />
        </AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Pencil className={`${iconSize} text-white`} />
      </div>
    </button>
  );
}

// Inline nickname editor
function NicknameEditor({
  value,
  onChange,
  onSave,
  onCancel,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  t: (key: any) => string;
}) {
  return (
    <div className="py-2 border-b border-border/40">
      <p className="text-xs text-muted-foreground mb-1.5">{t('profile.nickname')}</p>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={20}
          placeholder={t('profile.nicknamePlaceholder')}
          className="h-8 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
        <Button size="sm" className="h-8 px-3 text-xs" onClick={onSave}>{t('common.save')}</Button>
        <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={onCancel}>{t('common.cancel')}</Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{value.length}/20</p>
    </div>
  );
}

// Pronouns dropdown editor
function PronounsDropdown({
  currentPronouns,
  customValue,
  onCustomChange,
  onSelect,
  onCancel,
  t,
}: {
  currentPronouns: string;
  customValue: string;
  onCustomChange: (v: string) => void;
  onSelect: (value: string) => void;
  onCancel: () => void;
  t: (key: any) => string;
}) {
  const isCustom = currentPronouns === 'Custom' || 
    (currentPronouns && !PRONOUN_OPTIONS.some(p => p.value === currentPronouns));
  const [showCustom, setShowCustom] = useState(!!isCustom);

  const selectValue = isCustom ? 'Custom' : (currentPronouns || '__none__');

  return (
    <div className="py-2 border-b border-border/40">
      <p className="text-xs text-muted-foreground mb-1.5">{t('profile.pronouns')}</p>
      <div className="flex items-center gap-2">
        <Select
          value={selectValue}
          onValueChange={(val) => {
            if (val === 'Custom') {
              setShowCustom(true);
            } else {
              setShowCustom(false);
              onSelect(val);
            }
          }}
        >
          <SelectTrigger className="w-full min-h-[36px] h-9 text-sm bg-background">
            <SelectValue placeholder={t('profile.selectPronouns')} />
          </SelectTrigger>
          <SelectContent className="bg-popover z-[9999]" position="popper" sideOffset={4}>
            {PRONOUN_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="h-9 text-xs flex-shrink-0" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            maxLength={20}
            placeholder={t('profile.customPronounsPlaceholder')}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customValue.trim()) {
                onSelect(customValue.trim());
              }
            }}
          />
          <Button 
            size="sm" 
            className="h-8 px-3 text-xs" 
            onClick={() => {
              if (customValue.trim()) onSelect(customValue.trim());
            }}
            disabled={!customValue.trim()}
          >
            {t('common.save')}
          </Button>
        </div>
      )}
    </div>
  );
}

// Shared dialogs renderer
function ProfileDialogs({
  avatarDialogOpen,
  setAvatarDialogOpen,
  locationDialogOpen,
  setLocationDialogOpen,
  avatarUrl,
  preferences,
  onUpdate,
}: {
  avatarDialogOpen: boolean;
  setAvatarDialogOpen: (open: boolean) => void;
  locationDialogOpen: boolean;
  setLocationDialogOpen: (open: boolean) => void;
  avatarUrl: string;
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}) {
  return (
    <>
      <AvatarEditDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        currentUrl={avatarUrl}
        onSave={(url) => onUpdate({ avatar_url: url })}
      />
      <LocationEditDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        country={preferences.location_country || ''}
        region={preferences.location_region || ''}
        city={preferences.location_city || ''}
        onSave={(loc) => onUpdate(loc)}
      />
    </>
  );
}

// --- Desktop Card ---
export function MyProfileCard({ preferences, onUpdate }: MyProfileCardProps) {
  const profile = useProfileEditing(preferences, onUpdate);
  const { t } = profile;

  return (
    <>
      <div className="rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="px-5 py-5">
        <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Avatar only */}
            <div className="flex items-center justify-center md:w-32 flex-shrink-0 py-2">
              <AvatarWithOverlay
                avatarUrl={profile.avatarUrl}
                nickname={profile.nickname}
                size="lg"
                onClick={() => profile.setAvatarDialogOpen(true)}
              />
            </div>

            {/* Right: Editable Fields */}
            <div className="flex-1 min-w-0">
              {/* Nickname */}
              {profile.editingNickname ? (
                <NicknameEditor
                  value={profile.nicknameValue}
                  onChange={profile.setNicknameValue}
                  onSave={profile.saveNickname}
                  onCancel={() => profile.setEditingNickname(false)}
                  t={t}
                />
              ) : (
                <ProfileRow
                  label={t('profile.nickname')}
                  value={profile.nickname}
                  placeholder={t('profile.noNickname')}
                  onEdit={profile.startEditNickname}
                  editLabel={t('common.edit')}
                />
              )}

              {/* Pronouns */}
              {profile.editingPronouns ? (
                <PronounsDropdown
                  currentPronouns={profile.pronouns}
                  customValue={profile.customPronounValue}
                  onCustomChange={profile.setCustomPronounValue}
                  onSelect={(value) => {
                    onUpdate({ gender: value });
                    profile.setEditingPronouns(false);
                    toast({ title: t('profile.profileUpdated') });
                  }}
                  onCancel={() => profile.setEditingPronouns(false)}
                  t={t}
                />
              ) : (
                <ProfileRow
                  label={t('profile.pronouns')}
                  value={profile.pronounsLabel}
                  placeholder={t('profile.notSet')}
                  onEdit={profile.startEditPronouns}
                  editLabel={t('common.edit')}
                />
              )}

              {/* Home Base */}
              <ProfileRow
                label={t('profile.homeBase')}
                value={profile.locationStr}
                placeholder={t('profile.notSet')}
                onEdit={() => profile.setLocationDialogOpen(true)}
                editLabel={t('common.edit')}
              />
            </div>
          </div>
        </div>
      </div>

      <ProfileDialogs
        avatarDialogOpen={profile.avatarDialogOpen}
        setAvatarDialogOpen={profile.setAvatarDialogOpen}
        locationDialogOpen={profile.locationDialogOpen}
        setLocationDialogOpen={profile.setLocationDialogOpen}
        avatarUrl={profile.avatarUrl}
        preferences={preferences}
        onUpdate={onUpdate}
      />
    </>
  );
}

// --- Mobile Accordion Content ---
export function MyProfileContent({ preferences, onUpdate }: MyProfileCardProps) {
  const profile = useProfileEditing(preferences, onUpdate);
  const { t } = profile;

  return (
    <>
      <div className="space-y-3 py-2">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <AvatarWithOverlay
            avatarUrl={profile.avatarUrl}
            nickname={profile.nickname}
            size="sm"
            onClick={() => profile.setAvatarDialogOpen(true)}
          />
        </div>

        {/* Nickname */}
        {profile.editingNickname ? (
          <NicknameEditor
            value={profile.nicknameValue}
            onChange={profile.setNicknameValue}
            onSave={profile.saveNickname}
            onCancel={() => profile.setEditingNickname(false)}
            t={t}
          />
        ) : (
          <ProfileRow
            label={t('profile.nickname')}
            value={profile.nickname}
            placeholder={t('profile.noNickname')}
            onEdit={profile.startEditNickname}
            editLabel={t('common.edit')}
          />
        )}

        {/* Pronouns */}
        {profile.editingPronouns ? (
          <PronounsDropdown
            currentPronouns={profile.pronouns}
            customValue={profile.customPronounValue}
            onCustomChange={profile.setCustomPronounValue}
            onSelect={(value) => {
              onUpdate({ gender: value });
              profile.setEditingPronouns(false);
              toast({ title: t('profile.profileUpdated') });
            }}
            onCancel={() => profile.setEditingPronouns(false)}
            t={t}
          />
        ) : (
          <ProfileRow
            label={t('profile.pronouns')}
            value={profile.pronounsLabel}
            placeholder={t('profile.notSet')}
            onEdit={profile.startEditPronouns}
            editLabel={t('common.edit')}
          />
        )}

        {/* Home Base */}
        <ProfileRow
          label={t('profile.homeBase')}
          value={profile.locationStr}
          placeholder={t('profile.notSet')}
          onEdit={() => profile.setLocationDialogOpen(true)}
          editLabel={t('common.edit')}
        />
      </div>

      <ProfileDialogs
        avatarDialogOpen={profile.avatarDialogOpen}
        setAvatarDialogOpen={profile.setAvatarDialogOpen}
        locationDialogOpen={profile.locationDialogOpen}
        setLocationDialogOpen={profile.setLocationDialogOpen}
        avatarUrl={profile.avatarUrl}
        preferences={preferences}
        onUpdate={onUpdate}
      />
    </>
  );
}
