import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAddEvent, useRemoveEvent } from '@/hooks/useUserEvents';
import { PassportSegmentedFilter } from './PassportSegmentedFilter';
import type { PassportExhibition } from '@/hooks/usePassportData';

interface ExhibitionsTabProps {
  exhibitions: PassportExhibition[];
  selectedYear: number | null;
}

const SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'attended', label: 'Attended' },
  { value: 'completed', label: 'Completed' },
];

function formatDate(date?: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ExhibitionsTab({ exhibitions, selectedYear }: ExhibitionsTabProps) {
  const navigate = useNavigate();
  const addEvent = useAddEvent();
  const removeEvent = useRemoveEvent();
  const [segment, setSegment] = useState('all');
  const [justStamped, setJustStamped] = useState<Set<string>>(new Set());

  const yearFiltered = useMemo(() => {
    if (!selectedYear) return exhibitions;
    return exhibitions.filter(e => e.latestEventDate && new Date(e.latestEventDate).getFullYear() === selectedYear);
  }, [exhibitions, selectedYear]);

  const counts = useMemo(() => ({
    all: yearFiltered.length,
    planned: yearFiltered.filter(e => e.status === 'planned').length,
    attended: yearFiltered.filter(e => e.status === 'attended').length,
    completed: yearFiltered.filter(e => e.status === 'completed').length,
  }), [yearFiltered]);

  const segments = SEGMENTS.map(s => ({ ...s, count: counts[s.value as keyof typeof counts] }));

  const filtered = useMemo(() => {
    let items = yearFiltered;
    if (segment !== 'all') items = items.filter(e => e.status === segment);
    return [...items].sort((a, b) => {
      if (segment === 'planned') return new Date(b.wishDate || 0).getTime() - new Date(a.wishDate || 0).getTime();
      if (segment === 'attended' || segment === 'completed') return new Date(b.attendedDate || 0).getTime() - new Date(a.attendedDate || 0).getTime();
      return new Date(b.latestEventDate).getTime() - new Date(a.latestEventDate).getTime();
    });
  }, [yearFiltered, segment]);

  const handleStamp = useCallback(async (exhibitionId: string) => {
    try {
      await addEvent.mutateAsync({ event_type: 'attend_exhibition', item_type: 'exhibition', item_id: exhibitionId });
      setJustStamped(prev => new Set(prev).add(exhibitionId));
      setTimeout(() => setJustStamped(prev => { const n = new Set(prev); n.delete(exhibitionId); return n; }), 1000);
      toast({ title: 'Stamp added to your passport ✦', description: 'Exhibition marked as attended!' });
    } catch { /* handled */ }
  }, [addEvent]);

  const handleRemove = useCallback(async (eventType: string, itemId: string) => {
    await removeEvent.mutateAsync({ event_type: eventType as any, item_id: itemId });
  }, [removeEvent]);

  if (exhibitions.length === 0 && segment === 'all') {
    return (
      <div className="space-y-4">
        <PassportSegmentedFilter segments={segments} value={segment} onChange={setSegment} />
        <div className="gallery-card text-center py-10">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm mb-4">
            No exhibitions in your passport yet. Browse exhibitions and add them!
          </p>
          <Button onClick={() => navigate('/exhibitions')} size="sm">
            <Calendar className="w-4 h-4 mr-1.5" />
            Browse Exhibitions
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
          <p className="text-muted-foreground text-sm">No exhibitions match the current filter.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(({ exhibition, status, wishDate, attendedDate }) => {
            const isJustStamped = justStamped.has(exhibition.exhibition_id);
            const rotation = ((exhibition.exhibition_id.charCodeAt(0) * 7 + 3) % 11) - 5;

            return (
              <div
                key={exhibition.exhibition_id}
                className={cn(
                  'group relative gallery-card transition-all overflow-hidden',
                  status === 'planned' && 'border-2 border-dashed border-[hsl(var(--gold-border)/0.3)] bg-card/50',
                  status === 'attended' && 'passport-stamp-card border-2 border-[hsl(var(--gold-border)/0.4)] hover:border-[hsl(var(--gold-border)/0.7)]',
                  status === 'completed' && 'passport-stamp-card border-2 border-[hsl(var(--gold-border)/0.6)] hover:border-[hsl(var(--gold-border)/0.9)]',
                  isJustStamped && 'stamp-press',
                )}
                style={{ '--stamp-rotation': `${rotation}deg` } as React.CSSProperties}
              >
                {(status === 'attended' || status === 'completed') && (
                  <div className="absolute -top-1 -right-1 w-14 h-14 opacity-[0.08]">
                    <div className="w-full h-full rounded-full border-[3px] border-dashed border-primary" style={{ transform: `rotate(${rotation}deg)` }} />
                  </div>
                )}

                <div className="flex items-center gap-3.5">
                  {/* Cover image */}
                  <div className={cn(
                    'w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden bg-muted',
                    status === 'planned' ? 'border border-dashed border-[hsl(var(--gold-border)/0.2)]' : 'border border-[hsl(var(--gold-border)/0.3)]',
                  )}>
                    {exhibition.cover_image_url ? (
                      <img
                        src={exhibition.cover_image_url}
                        alt={exhibition.exhibition_name}
                        className={cn('w-full h-full object-cover', status === 'planned' && 'opacity-60')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <Calendar className="w-5 h-5 text-primary/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground leading-tight whitespace-normal break-words text-sm">
                      {exhibition.exhibition_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exhibition.museum_name} · {exhibition.city}
                    </p>

                    {status === 'completed' && (
                      <span className="text-[10px] font-display font-semibold text-accent uppercase tracking-wide">
                        Wish → Attended ✦
                      </span>
                    )}

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {exhibition.date_label && (
                        <span className="text-[11px] text-muted-foreground/60">{exhibition.date_label}</span>
                      )}
                      {status === 'planned' && wishDate && (
                        <span className="text-[11px] text-muted-foreground/70 tabular-nums">Wished: {formatDate(wishDate)}</span>
                      )}
                      {(status === 'attended' || status === 'completed') && attendedDate && (
                        <span className="text-[11px] text-muted-foreground/70 tabular-nums">Attended: {formatDate(attendedDate)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {status === 'planned' && (
                      <Button variant="default" size="sm" onClick={() => handleStamp(exhibition.exhibition_id)} className="text-xs">
                        Stamp it
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                      onClick={() => {
                        if (status === 'planned') handleRemove('wishlist_add', exhibition.exhibition_id);
                        else handleRemove('attend_exhibition', exhibition.exhibition_id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
