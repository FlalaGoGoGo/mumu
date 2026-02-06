import { useState, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import mumuLogo from '@/assets/mumu-logo.png';

interface AvatarEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl: string;
  onSave: (url: string) => void;
}

export function AvatarEditDialog({ open, onOpenChange, currentUrl, onSave }: AvatarEditDialogProps) {
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
              <div className="w-full h-full flex items-center justify-center p-4">
                <img src={mumuLogo} alt="MuMu" className="w-full h-full object-contain" />
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
