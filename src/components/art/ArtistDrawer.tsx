import { Artist } from '@/types/art';
import { useLanguage } from '@/lib/i18n';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ArtistPanel } from './ArtistPanel';

interface ArtistDrawerProps {
  artist: Artist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtistDrawer({ artist, open, onOpenChange }: ArtistDrawerProps) {
  const { t } = useLanguage();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>{artist?.artist_name || t('art.artistDetails')}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto">
          <ArtistPanel artist={artist} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
