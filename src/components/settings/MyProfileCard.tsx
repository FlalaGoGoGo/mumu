import { useState, useRef } from 'react';
import { UserPreferences } from '@/hooks/usePreferences';
import { useSession } from '@/hooks/useSession';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Camera, MapPin, User, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MyProfileCardProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

function getInitials(nickname: string): string {
  if (!nickname.trim()) return '?';
  return nickname.trim().charAt(0).toUpperCase();
}

function formatLocation(country: string, region: string, city: string): string {
  const parts = [city, region, country].filter(Boolean);
  return parts.join(', ') || '';
}

// --- Avatar Edit Dialog ---
function AvatarEditDialog({
  open,
  onOpenChange,
  currentUrl,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl: string;
  onSave: (url: string) => void;
}) {
  const { t } = useLanguage();
  const sessionId = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 3 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 3MB.', variant: 'destructive' });
      return;
    }
    if (!selected.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select a JPG or PNG image.', variant: 'destructive' });
      return;
    }
    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  };

  const handleSave = async () => {
    if (!file || !sessionId) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${sessionId}/avatar.${ext}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      onSave(avatarUrl);
      toast({ title: t('profile.profileUpdated') });
      onOpenChange(false);
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">{t('profile.editAvatar')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-border bg-muted">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : currentUrl ? (
              <img src={currentUrl} alt="Current avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Camera className="w-4 h-4 mr-2" />
            {t('profile.choosePhoto')}
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG • Max 3MB</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} disabled={!file || uploading}>
            {uploading ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Location Edit Dialog ---
function LocationEditDialog({
  open,
  onOpenChange,
  country,
  region,
  city,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country: string;
  region: string;
  city: string;
  onSave: (loc: { location_country: string; location_region: string; location_city: string }) => void;
}) {
  const { t } = useLanguage();
  const [formCountry, setFormCountry] = useState(country);
  const [formRegion, setFormRegion] = useState(region);
  const [formCity, setFormCity] = useState(city);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setFormCountry(country);
      setFormRegion(region);
      setFormCity(city);
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    onSave({
      location_country: formCountry.trim(),
      location_region: formRegion.trim(),
      location_city: formCity.trim(),
    });
    toast({ title: t('profile.profileUpdated') });
    onOpenChange(false);
  };

  const handleClear = () => {
    onSave({ location_country: '', location_region: '', location_city: '' });
    toast({ title: t('profile.profileUpdated') });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">{t('profile.editLocation')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('profile.country')}</Label>
            <Input
              value={formCountry}
              onChange={(e) => setFormCountry(e.target.value)}
              placeholder={t('profile.countryPlaceholder')}
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('profile.region')}</Label>
            <Input
              value={formRegion}
              onChange={(e) => setFormRegion(e.target.value)}
              placeholder={t('profile.regionPlaceholder')}
              maxLength={60}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('profile.city')}</Label>
            <Input
              value={formCity}
              onChange={(e) => setFormCity(e.target.value)}
              placeholder={t('profile.cityPlaceholder')}
              maxLength={60}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground mr-auto">
            <X className="w-4 h-4 mr-1" />
            {t('profile.clearLocation')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Editable Row ---
function ProfileRow({
  label,
  value,
  placeholder,
  onEdit,
}: {
  label: string;
  value: string;
  placeholder: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={cn("text-sm truncate", value ? "text-foreground" : "text-muted-foreground/60 italic")}>
          {value || placeholder}
        </p>
      </div>
      <Button variant="outline" size="sm" className="ml-3 h-7 px-3 text-xs flex-shrink-0 rounded-full" onClick={onEdit}>
        <Pencil className="w-3 h-3 mr-1" />
        Edit
      </Button>
    </div>
  );
}

// --- Main Card ---
export function MyProfileCard({ preferences, onUpdate }: MyProfileCardProps) {
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

  const GENDER_OPTIONS = [
    { value: 'Female', labelKey: 'profile.female' as const },
    { value: 'Male', labelKey: 'profile.male' as const },
    { value: 'Non-binary', labelKey: 'profile.nonBinary' as const },
    { value: 'Prefer not to say', labelKey: 'profile.preferNotToSay' as const },
  ];

  const startEditNickname = () => {
    setNicknameValue(nickname);
    setEditingNickname(true);
  };

  const saveNickname = () => {
    const trimmed = nicknameValue.trim();
    if (trimmed.length > 20) {
      toast({ title: 'Nickname must be 20 characters or fewer.', variant: 'destructive' });
      return;
    }
    onUpdate({ nickname: trimmed });
    setEditingNickname(false);
    toast({ title: t('profile.profileUpdated') });
  };

  const genderLabel = gender
    ? GENDER_OPTIONS.find(g => g.value === gender)
      ? t(GENDER_OPTIONS.find(g => g.value === gender)!.labelKey)
      : gender
    : '';

  return (
    <>
      <div className="rounded-lg border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="px-5 py-4 border-b border-border/40">
          <h3 className="font-display text-lg font-semibold text-foreground">
            {t('profile.myProfile')}
          </h3>
        </div>
        <div className="px-5 py-5">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Avatar + Nickname */}
            <div className="flex flex-col items-center text-center md:w-48 flex-shrink-0">
              <button
                onClick={() => setAvatarDialogOpen(true)}
                className="group relative mb-3"
              >
                <Avatar className="w-20 h-20 border-2 border-border">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={nickname || 'Avatar'} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display font-semibold">
                    {getInitials(nickname)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </button>
              <h4 className="font-display text-lg font-semibold text-foreground truncate max-w-full">
                {nickname || t('profile.noNickname')}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('profile.usedForPassport')}
              </p>
            </div>

            {/* Right: Editable Fields */}
            <div className="flex-1 min-w-0">
              {/* Avatar row */}
              <ProfileRow
                label={t('profile.avatar')}
                value={avatarUrl ? t('profile.photoUploaded') : ''}
                placeholder={t('profile.noPhoto')}
                onEdit={() => setAvatarDialogOpen(true)}
              />

              {/* Nickname row */}
              {editingNickname ? (
                <div className="py-2.5 border-b border-border/40">
                  <p className="text-xs text-muted-foreground mb-1.5">{t('profile.nickname')}</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={nicknameValue}
                      onChange={(e) => setNicknameValue(e.target.value)}
                      maxLength={20}
                      placeholder={t('profile.nicknamePlaceholder')}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveNickname();
                        if (e.key === 'Escape') setEditingNickname(false);
                      }}
                    />
                    <Button size="sm" className="h-8 px-3 text-xs" onClick={saveNickname}>
                      {t('common.save')}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setEditingNickname(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{nicknameValue.length}/20</p>
                </div>
              ) : (
                <ProfileRow
                  label={t('profile.nickname')}
                  value={nickname}
                  placeholder={t('profile.noNickname')}
                  onEdit={startEditNickname}
                />
              )}

              {/* Gender row */}
              {editingGender ? (
                <div className="py-2.5 border-b border-border/40">
                  <p className="text-xs text-muted-foreground mb-1.5">{t('profile.gender')}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {GENDER_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={gender === opt.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs rounded-full"
                        onClick={() => {
                          onUpdate({ gender: opt.value });
                          setEditingGender(false);
                          toast({ title: t('profile.profileUpdated') });
                        }}
                      >
                        {t(opt.labelKey)}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setEditingGender(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <ProfileRow
                  label={t('profile.gender')}
                  value={genderLabel}
                  placeholder={t('profile.notSet')}
                  onEdit={() => setEditingGender(true)}
                />
              )}

              {/* Location row */}
              <ProfileRow
                label={t('profile.location')}
                value={locationStr}
                placeholder={t('profile.notSet')}
                onEdit={() => setLocationDialogOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
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

// For accordion use on mobile
export function MyProfileContent({ preferences, onUpdate }: MyProfileCardProps) {
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

  const GENDER_OPTIONS = [
    { value: 'Female', labelKey: 'profile.female' as const },
    { value: 'Male', labelKey: 'profile.male' as const },
    { value: 'Non-binary', labelKey: 'profile.nonBinary' as const },
    { value: 'Prefer not to say', labelKey: 'profile.preferNotToSay' as const },
  ];

  const startEditNickname = () => {
    setNicknameValue(nickname);
    setEditingNickname(true);
  };

  const saveNickname = () => {
    const trimmed = nicknameValue.trim();
    if (trimmed.length > 20) {
      toast({ title: 'Nickname must be 20 characters or fewer.', variant: 'destructive' });
      return;
    }
    onUpdate({ nickname: trimmed });
    setEditingNickname(false);
    toast({ title: t('profile.profileUpdated') });
  };

  const genderLabel = gender
    ? GENDER_OPTIONS.find(g => g.value === gender)
      ? t(GENDER_OPTIONS.find(g => g.value === gender)!.labelKey)
      : gender
    : '';

  return (
    <>
      <div className="space-y-4 py-2">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <button onClick={() => setAvatarDialogOpen(true)} className="group relative flex-shrink-0">
            <Avatar className="w-16 h-16 border-2 border-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={nickname || 'Avatar'} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-display font-semibold">
                {getInitials(nickname)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </button>
          <div className="min-w-0">
            <h4 className="font-display text-base font-semibold truncate">{nickname || t('profile.noNickname')}</h4>
            <p className="text-xs text-muted-foreground">{t('profile.usedForPassport')}</p>
          </div>
        </div>

        {/* Fields */}
        <ProfileRow
          label={t('profile.avatar')}
          value={avatarUrl ? t('profile.photoUploaded') : ''}
          placeholder={t('profile.noPhoto')}
          onEdit={() => setAvatarDialogOpen(true)}
        />

        {editingNickname ? (
          <div className="py-2.5 border-b border-border/40">
            <p className="text-xs text-muted-foreground mb-1.5">{t('profile.nickname')}</p>
            <div className="flex items-center gap-2">
              <Input
                value={nicknameValue}
                onChange={(e) => setNicknameValue(e.target.value)}
                maxLength={20}
                placeholder={t('profile.nicknamePlaceholder')}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveNickname();
                  if (e.key === 'Escape') setEditingNickname(false);
                }}
              />
              <Button size="sm" className="h-8 px-3 text-xs" onClick={saveNickname}>{t('common.save')}</Button>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setEditingNickname(false)}>{t('common.cancel')}</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{nicknameValue.length}/20</p>
          </div>
        ) : (
          <ProfileRow label={t('profile.nickname')} value={nickname} placeholder={t('profile.noNickname')} onEdit={startEditNickname} />
        )}

        {editingGender ? (
          <div className="py-2.5 border-b border-border/40">
            <p className="text-xs text-muted-foreground mb-1.5">{t('profile.gender')}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {GENDER_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={gender === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs rounded-full"
                  onClick={() => {
                    onUpdate({ gender: opt.value });
                    setEditingGender(false);
                    toast({ title: t('profile.profileUpdated') });
                  }}
                >
                  {t(opt.labelKey)}
                </Button>
              ))}
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditingGender(false)}>{t('common.cancel')}</Button>
            </div>
          </div>
        ) : (
          <ProfileRow label={t('profile.gender')} value={genderLabel} placeholder={t('profile.notSet')} onEdit={() => setEditingGender(true)} />
        )}

        <ProfileRow
          label={t('profile.location')}
          value={locationStr}
          placeholder={t('profile.notSet')}
          onEdit={() => setLocationDialogOpen(true)}
        />
      </div>

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
