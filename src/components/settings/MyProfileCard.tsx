import { useState } from 'react';
import { UserPreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ProfileRow } from './profile/ProfileRow';
import { AvatarEditDialog } from './profile/AvatarEditDialog';
import { LocationEditDialog } from './profile/LocationEditDialog';

interface MyProfileCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

function getInitials(nickname: string): string {
  if (!nickname.trim()) return '?';
  return nickname.trim().charAt(0).toUpperCase();
}

function formatLocation(country: string, region: string, city: string): string {
  return [country, region, city].filter(Boolean).join(', ');
}

const GENDER_OPTIONS = [
  { value: 'Female', labelKey: 'profile.female' as const },
  { value: 'Male', labelKey: 'profile.male' as const },
  { value: 'Non-binary', labelKey: 'profile.nonBinary' as const },
  { value: 'Prefer not to say', labelKey: 'profile.preferNotToSay' as const },
];

// Shared profile editing logic
function useProfileEditing(preferences: MyProfileCardProps['preferences'], onUpdate: MyProfileCardProps['onUpdate']) {
  const { t } = useLanguage();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');
  const [editingGender, setEditingGender] = useState(false);

  const nickname = preferences.nickname || '';
  const avatarUrl = preferences.avatar_url || '';
  const gender = preferences.gender || '';
  const locationStr = formatLocation(
    preferences.location_country || '',
    preferences.location_region || '',
    preferences.location_city || ''
  );

  const genderLabel = gender
    ? GENDER_OPTIONS.find(g => g.value === gender)
      ? t(GENDER_OPTIONS.find(g => g.value === gender)!.labelKey)
      : gender
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

  return {
    t,
    avatarDialogOpen, setAvatarDialogOpen,
    locationDialogOpen, setLocationDialogOpen,
    editingNickname, setEditingNickname,
    nicknameValue, setNicknameValue,
    editingGender, setEditingGender,
    nickname, avatarUrl, gender, locationStr, genderLabel,
    startEditNickname, saveNickname,
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
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={nickname || 'Avatar'} /> : null}
        <AvatarFallback className={`bg-primary/10 text-primary ${textSize} font-display font-semibold`}>
          {getInitials(nickname)}
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

// Gender inline editor
function GenderEditor({
  currentGender,
  onSelect,
  onCancel,
  t,
}: {
  currentGender: string;
  onSelect: (value: string) => void;
  onCancel: () => void;
  t: (key: any) => string;
}) {
  return (
    <div className="py-2 border-b border-border/40">
      <p className="text-xs text-muted-foreground mb-1.5">{t('profile.gender')}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {GENDER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={currentGender === opt.value ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs rounded-full"
            onClick={() => onSelect(opt.value)}
          >
            {t(opt.labelKey)}
          </Button>
        ))}
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onCancel}>{t('common.cancel')}</Button>
      </div>
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

              {/* Gender */}
              {profile.editingGender ? (
                <GenderEditor
                  currentGender={profile.gender}
                  onSelect={(value) => {
                    onUpdate({ gender: value });
                    profile.setEditingGender(false);
                    toast({ title: t('profile.profileUpdated') });
                  }}
                  onCancel={() => profile.setEditingGender(false)}
                  t={t}
                />
              ) : (
                <ProfileRow
                  label={t('profile.gender')}
                  value={profile.genderLabel}
                  placeholder={t('profile.notSet')}
                  onEdit={() => profile.setEditingGender(true)}
                  editLabel={t('common.edit')}
                />
              )}

              {/* Location */}
              <ProfileRow
                label={t('profile.location')}
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

        {/* Gender */}
        {profile.editingGender ? (
          <GenderEditor
            currentGender={profile.gender}
            onSelect={(value) => {
              onUpdate({ gender: value });
              profile.setEditingGender(false);
              toast({ title: t('profile.profileUpdated') });
            }}
            onCancel={() => profile.setEditingGender(false)}
            t={t}
          />
        ) : (
          <ProfileRow
            label={t('profile.gender')}
            value={profile.genderLabel}
            placeholder={t('profile.notSet')}
            onEdit={() => profile.setEditingGender(true)}
            editLabel={t('common.edit')}
          />
        )}

        {/* Location */}
        <ProfileRow
          label={t('profile.location')}
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
