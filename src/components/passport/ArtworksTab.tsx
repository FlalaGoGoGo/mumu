import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getArtworkImageUrl } from '@/types/art';
import { useAddEvent, useRemoveEvent } from '@/hooks/useUserEvents';
import { PassportSegmentedFilter } from './PassportSegmentedFilter';
import type { PassportArtwork } from '@/hooks/usePassportData';

interface ArtworksTabProps {
  artworks: PassportArtwork[];
  selectedYear: number | null;
}

const SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'seen', label: 'Seen' },
  { value: 'completed', label: 'Completed' },
];

export function ArtworksTab({ artworks, selectedYear }: ArtworksTabProps) {
  const navigate = useNavigate();
  const addEvent = useAddEvent();
  const removeEvent = useRemoveEvent();
  const [segment, setSegment] = useState('all');
  const [justStamped, setJustStamped] = useState<Set<string>>(new Set());

  const yearFiltered = useMemo(() => {
    if (!selectedYear) return artworks;
    return artworks.filter(a => a.latestEventDate && new Date(a.latestEventDate).getFullYear() === selectedYear);
  }, [artworks, selectedYear]);

  const counts = useMemo(() => ({
    all: yearFiltered.length,
    planned: yearFiltered.filter(a => a.status === 'planned').length,
    seen: yearFiltered.filter(a => a.status === 'seen').length,
    completed: yearFiltered.filter(a => a.status === 'completed').length,
  }), [yearFiltered]);

  const segments = SEGMENTS.map(s => ({ ...s, count: counts[s.value as keyof typeof counts] }));

  const filtered = useMemo(() => {
    let items = yearFiltered;
    if (segment !== 'all') items = items.filter(a => a.status === segment);
    return [...items].sort((a, b) => {
      if (segment === 'planned') return new Date(b.wishDate || 0).getTime() - new Date(a.wishDate || 0).getTime();
      if (segment === 'seen' || segment === 'completed') return new Date(b.seenDate || 0).getTime() - new Date(a.seenDate || 0).getTime();
      return new Date(b.latestEventDate).getTime() - new Date(a.latestEventDate).getTime();
    });
  }, [yearFiltered, segment]);

  const handleStamp = useCallback(async (artworkId: string) => {
    try {
      await addEvent.mutateAsync({ event_type: 'see_artwork', item_type: 'artwork', item_id: artworkId });
      setJustStamped(prev => new Set(prev).add(artworkId));
      setTimeout(() => setJustStamped(prev => { const n = new Set(prev); n.delete(artworkId); return n; }), 1000);
      toast({ title: 'Stamp added to your passport ✦', description: 'Artwork marked as seen!' });
    } catch { /* handled */ }
  }, [addEvent]);

  const handleRemove = useCallback(async (eventType: string, itemId: string) => {
    await removeEvent.mutateAsync({ event_type: eventType as any, item_id: itemId });
  }, [removeEvent]);

  if (artworks.length === 0 && segment === 'all') {
    return (
      <div className="space-y-4">
        <PassportSegmentedFilter segments={segments} value={segment} onChange={setSegment} />
        <div className="gallery-card text-center py-10">
          <Palette className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm mb-4">
            No artworks in your passport yet. Browse artworks and add them!
          </p>
          <Button onClick={() => navigate('/art')} size="sm">
            <ImageIcon className="w-4 h-4 mr-1.5" />
            Browse Artworks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PassportSegmentedFilter segments={segments} value={segment} onChange={setSegment} />

      {filtered.length === 0 ? (
        <div className="gallery-card text-center py-8">
          <p className="text-muted-foreground text-sm">No artworks match the current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {filtered.map(({ artwork, status, wishDate, seenDate }) => {
            const imageUrl = getArtworkImageUrl(artwork);
            const isJustStamped = justStamped.has(artwork.artwork_id);
            return (
              <div
                key={artwork.artwork_id}
                className={cn(
                  'group relative aspect-square overflow-hidden cursor-pointer transition-all bg-muted',
                  status === 'planned' && 'border-2 border-dashed border-[hsl(var(--gold-border)/0.2)] opacity-70',
                  status === 'seen' && 'border-2 border-[hsl(var(--gold-border)/0.3)] hover:border-[hsl(var(--gold-border)/0.7)]',
                  status === 'completed' && 'border-2 border-[hsl(var(--gold-border)/0.6)] hover:border-[hsl(var(--gold-border)/0.9)]',
                  isJustStamped && 'stamp-press',
                )}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={artwork.title}
                    className={cn('w-full h-full object-cover', status === 'planned' && 'opacity-50')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}

                {/* Completed badge */}
                {status === 'completed' && (
                  <div className="absolute top-1 left-1 text-[8px] font-display font-bold text-accent bg-black/60 px-1 py-0.5 rounded">
                    ✦
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                  <h3 className="font-display text-[11px] font-semibold text-white leading-tight whitespace-normal break-words">
                    {artwork.title}
                  </h3>
                  <p className="text-[10px] text-white/70 whitespace-normal break-words mt-0.5">
                    {artwork.artist_name}
                  </p>
                  {status === 'completed' && (
                    <p className="text-[9px] text-accent mt-0.5">Wish → Seen ✦</p>
                  )}

                  <div className="flex gap-1 mt-1.5">
                    {status === 'planned' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStamp(artwork.artwork_id); }}
                        className="text-[9px] bg-primary text-primary-foreground px-2 py-0.5 rounded font-medium"
                      >
                        Stamp it
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (status === 'planned') handleRemove('wishlist_add', artwork.artwork_id);
                        else if (status === 'seen') handleRemove('see_artwork', artwork.artwork_id);
                        else {
                          handleRemove('see_artwork', artwork.artwork_id);
                          handleRemove('wishlist_add', artwork.artwork_id);
                        }
                      }}
                      className="p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
