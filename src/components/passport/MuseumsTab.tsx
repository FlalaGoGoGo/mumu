import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAddEvent, useRemoveEvent } from '@/hooks/useUserEvents';
import { PassportSegmentedFilter } from './PassportSegmentedFilter';
import { MuseumStampCard } from './MuseumStampCard';
import { PassportWorldMap } from './PassportWorldMap';
import type { PassportMuseum } from '@/hooks/usePassportData';

interface MuseumsTabProps {
  museums: PassportMuseum[];
  countries: string[];
  selectedYear: number | null;
  selectedCountry: string | null;
  onCountrySelect: (country: string | null) => void;
}

const SEGMENTS = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'visited', label: 'Visited' },
  { value: 'completed', label: 'Completed' },
];

export function MuseumsTab({
  museums, countries, selectedYear, selectedCountry, onCountrySelect,
}: MuseumsTabProps) {
  const navigate = useNavigate();
  const addEvent = useAddEvent();
  const removeEvent = useRemoveEvent();
  const [segment, setSegment] = useState('all');
  const [mapFilter, setMapFilter] = useState<'visited' | 'planned' | 'both'>('visited');
  const [justStamped, setJustStamped] = useState<Set<string>>(new Set());

  // Year-filter base
  const yearFiltered = useMemo(() => {
    if (!selectedYear) return museums;
    return museums.filter(m => m.latestEventDate && new Date(m.latestEventDate).getFullYear() === selectedYear);
  }, [museums, selectedYear]);

  // Segment counts
  const counts = useMemo(() => ({
    all: yearFiltered.length,
    planned: yearFiltered.filter(m => m.status === 'planned').length,
    visited: yearFiltered.filter(m => m.status === 'visited').length,
    completed: yearFiltered.filter(m => m.status === 'completed').length,
  }), [yearFiltered]);

  const segments = SEGMENTS.map(s => ({ ...s, count: counts[s.value as keyof typeof counts] }));

  // Filter + sort
  const filtered = useMemo(() => {
    let items = yearFiltered;
    if (segment !== 'all') items = items.filter(m => m.status === segment);
    return [...items].sort((a, b) => {
      if (segment === 'planned') return new Date(b.wishDate || 0).getTime() - new Date(a.wishDate || 0).getTime();
      if (segment === 'visited' || segment === 'completed') return new Date(b.visitDate || 0).getTime() - new Date(a.visitDate || 0).getTime();
      return new Date(b.latestEventDate).getTime() - new Date(a.latestEventDate).getTime();
    });
  }, [yearFiltered, segment]);

  // Map museums
  const mapMuseums = useMemo(() => {
    if (mapFilter === 'visited') return yearFiltered.filter(m => m.status === 'visited' || m.status === 'completed');
    if (mapFilter === 'planned') return yearFiltered.filter(m => m.status === 'planned' || m.status === 'completed');
    return yearFiltered;
  }, [yearFiltered, mapFilter]);

  const handleStamp = useCallback(async (museumId: string) => {
    try {
      await addEvent.mutateAsync({ event_type: 'visit_museum', item_type: 'museum', item_id: museumId });
      setJustStamped(prev => new Set(prev).add(museumId));
      setTimeout(() => setJustStamped(prev => { const n = new Set(prev); n.delete(museumId); return n; }), 1000);
      toast({ title: 'Stamp added to your passport ✦', description: 'Museum visit recorded!' });
    } catch { /* handled by mutation */ }
  }, [addEvent]);

  const handleAddWish = useCallback(async (museumId: string) => {
    try {
      await addEvent.mutateAsync({ event_type: 'wishlist_add', item_type: 'museum', item_id: museumId });
    } catch { /* handled */ }
  }, [addEvent]);

  const handleRemoveWish = useCallback(async (museumId: string) => {
    await removeEvent.mutateAsync({ event_type: 'wishlist_add', item_id: museumId });
  }, [removeEvent]);

  const handleRemoveVisit = useCallback(async (museumId: string) => {
    await removeEvent.mutateAsync({ event_type: 'visit_museum', item_id: museumId });
  }, [removeEvent]);

  return (
    <div className="space-y-4">
      <PassportSegmentedFilter segments={segments} value={segment} onChange={setSegment} />

      {/* Map */}
      <PassportWorldMap
        museums={mapMuseums}
        mapFilter={mapFilter}
        onMapFilterChange={setMapFilter}
        countries={countries}
        selectedCountry={selectedCountry}
        onCountrySelect={onCountrySelect}
      />

      {/* Museum list */}
      {filtered.length === 0 ? (
        <div className="gallery-card text-center py-10">
          <div className="passport-stamp mx-auto mb-4 w-20 h-20">
            <span className="text-[10px]">NO STAMPS</span>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            {museums.length === 0
              ? 'No museums in your passport yet. Start exploring!'
              : 'No museums match the current filter.'}
          </p>
          {museums.length === 0 && (
            <Button onClick={() => navigate('/')} size="sm">
              <MapPin className="w-4 h-4 mr-1.5" />
              Discover Museums
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(m => (
            <MuseumStampCard
              key={m.museum.museum_id}
              museum={m.museum}
              status={m.status}
              wishDate={m.wishDate}
              visitDate={m.visitDate}
              artworkCount={m.artworkCount}
              justStamped={justStamped.has(m.museum.museum_id)}
              onStamp={() => handleStamp(m.museum.museum_id)}
              onAddWish={() => handleAddWish(m.museum.museum_id)}
              onRemoveWish={() => handleRemoveWish(m.museum.museum_id)}
              onRemoveVisit={() => handleRemoveVisit(m.museum.museum_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
