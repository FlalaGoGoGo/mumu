import { useState, useMemo } from 'react';
import { useArtworkMovements } from '@/hooks/useArtworkMovements';
import { useEnrichedArtworks } from '@/hooks/useArtworks';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { MobilityFilters } from './MobilityFilters';
import { ArtworkJourneyView } from './ArtworkJourneyView';
import { MuseumBalanceView } from './MuseumBalanceView';
import type { EnrichedArtwork } from '@/types/art';
import type { ArtworkMovement, MobilityResearchStatus } from '@/types/movement';

type MobilityTab = 'journey' | 'balance';

interface Props {
  onBack: () => void;
}

export function MobilityExperience({ onBack }: Props) {
  const isMobile = useIsMobile();
  const { data: movements = [], isLoading: movLoading } = useArtworkMovements();
  const { data: artworks, artists, museums, isLoading: artLoading } = useEnrichedArtworks();

  const [tab, setTab] = useState<MobilityTab>('journey');
  const [artistId, setArtistId] = useState<string>('vincent-van-gogh');
  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([1800, 2030]);
  const [lenderMuseumId, setLenderMuseumId] = useState<string | null>(null);
  const [borrowerMuseumId, setBorrowerMuseumId] = useState<string | null>(null);

  const isLoading = movLoading || artLoading;

  // Artworks for the selected artist
  const artistArtworks = useMemo(() => {
    if (!artistId) return [];
    return artworks.filter(a => a.artist_id === artistId);
  }, [artworks, artistId]);

  // Auto-select first artwork with movements when artist changes
  const selectedArtworkId = useMemo(() => {
    if (artworkId && artistArtworks.some(a => a.artwork_id === artworkId)) return artworkId;
    // Find first artwork that has movement events
    const withMovements = artistArtworks.find(a => {
      const status = (a as any).mobility_research_status as string;
      return status === 'HAS_MOVEMENT_EVENTS';
    });
    return withMovements?.artwork_id || artistArtworks[0]?.artwork_id || null;
  }, [artworkId, artistArtworks, movements]);

  const selectedArtwork = useMemo(() => {
    return artworks.find(a => a.artwork_id === selectedArtworkId) || null;
  }, [artworks, selectedArtworkId]);

  // Filter movements
  const filteredMovements = useMemo(() => {
    let result = movements;
    if (artistId) result = result.filter(m => m.artist_id === artistId);
    if (selectedArtworkId && tab === 'journey') result = result.filter(m => m.artwork_id === selectedArtworkId);
    if (lenderMuseumId) result = result.filter(m => m.lender_museum_id === lenderMuseumId);
    if (borrowerMuseumId) result = result.filter(m => m.borrower_museum_id === borrowerMuseumId);
    // Year range filter
    result = result.filter(m => {
      if (!m.start_date) return true;
      const year = parseInt(m.start_date.substring(0, 4));
      return !isNaN(year) && year >= yearRange[0] && year <= yearRange[1];
    });
    return result.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  }, [movements, artistId, selectedArtworkId, lenderMuseumId, borrowerMuseumId, yearRange, tab]);

  // Museum map for lookups
  const museumMap = useMemo(() => {
    const map = new Map<string, { museum_id: string; name: string; lat: number; lng: number }>();
    for (const m of museums) {
      map.set(m.museum_id, { museum_id: m.museum_id, name: m.name, lat: m.lat, lng: m.lng });
    }
    return map;
  }, [museums]);

  // Available lender/borrower museums from filtered movements
  const lenderMuseums = useMemo(() => {
    const ids = new Set(movements.filter(m => !artistId || m.artist_id === artistId).map(m => m.lender_museum_id));
    return museums.filter(m => ids.has(m.museum_id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [movements, museums, artistId]);

  const borrowerMuseums = useMemo(() => {
    const ids = new Set(movements.filter(m => !artistId || m.artist_id === artistId).map(m => m.borrower_museum_id));
    return museums.filter(m => ids.has(m.museum_id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [movements, museums, artistId]);

  const mobilityStatus: MobilityResearchStatus = selectedArtwork
    ? ((selectedArtwork as any).mobility_research_status as MobilityResearchStatus) || 'NOT_RESEARCHED'
    : 'NOT_RESEARCHED';

  const mobilityNote: string = selectedArtwork
    ? ((selectedArtwork as any).mobility_research_note as string) || ''
    : '';

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to Art Collection
        </Button>
      </div>

      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          Artwork Journey
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trace the movements and loans of artworks across museums worldwide
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={tab === 'journey' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('journey')}
        >
          Artwork Journey
        </Button>
        <Button
          variant={tab === 'balance' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('balance')}
        >
          Museum Balance
        </Button>
      </div>

      {/* Filters */}
      <MobilityFilters
        artists={artists}
        artistId={artistId}
        onArtistChange={(id) => { setArtistId(id); setArtworkId(null); }}
        artworks={artistArtworks}
        artworkId={selectedArtworkId}
        onArtworkChange={setArtworkId}
        yearRange={yearRange}
        onYearRangeChange={setYearRange}
        lenderMuseums={lenderMuseums}
        lenderMuseumId={lenderMuseumId}
        onLenderMuseumChange={setLenderMuseumId}
        borrowerMuseums={borrowerMuseums}
        borrowerMuseumId={borrowerMuseumId}
        onBorrowerMuseumChange={setBorrowerMuseumId}
        showArtworkPicker={tab === 'journey'}
      />

      {/* Views */}
      {tab === 'journey' ? (
        <ArtworkJourneyView
          artwork={selectedArtwork}
          movements={filteredMovements}
          museumMap={museumMap}
          mobilityStatus={mobilityStatus}
          mobilityNote={mobilityNote}
        />
      ) : (
        <MuseumBalanceView
          movements={filteredMovements}
          museumMap={museumMap}
          artworks={artworks}
        />
      )}
    </div>
  );
}
