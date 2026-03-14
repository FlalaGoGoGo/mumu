import { useState, useMemo, useCallback } from 'react';
import { useArtworkMovements } from '@/hooks/useArtworkMovements';
import { useEnrichedArtworks } from '@/hooks/useArtworks';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import { MobilityFilters } from './MobilityFilters';
import { ArtistOverviewView } from './ArtistOverviewView';
import { ArtworkJourneyView } from './ArtworkJourneyView';
import { MuseumBalanceView } from './MuseumBalanceView';
import type { MobilityResearchStatus } from '@/types/movement';

type MobilityTab = 'overview' | 'journey' | 'balance';

interface Props {
  onBack: () => void;
}

export function MobilityExperience({ onBack }: Props) {
  const isMobile = useIsMobile();
  const { data: movements = [], isLoading: movLoading } = useArtworkMovements();
  const { data: artworks, artists, museums, isLoading: artLoading } = useEnrichedArtworks();

  const [tab, setTab] = useState<MobilityTab>('overview');
  const [artistId, setArtistId] = useState<string>('vincent-van-gogh');
  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([1800, 2030]);
  const [lenderMuseumId, setLenderMuseumId] = useState<string | null>(null);
  const [borrowerMuseumId, setBorrowerMuseumId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const isLoading = movLoading || artLoading;

  // Artworks for the selected artist
  const artistArtworks = useMemo(() => {
    if (!artistId) return [];
    return artworks.filter(a => a.artist_id === artistId);
  }, [artworks, artistId]);

  // Auto-select first artwork with movements when in journey tab
  const selectedArtworkId = useMemo(() => {
    if (tab !== 'journey') return null;
    if (artworkId && artistArtworks.some(a => a.artwork_id === artworkId)) return artworkId;
    const withMovements = artistArtworks.find(a => {
      const status = (a as any).mobility_research_status as string;
      return status === 'HAS_MOVEMENT_EVENTS';
    });
    return withMovements?.artwork_id || artistArtworks[0]?.artwork_id || null;
  }, [artworkId, artistArtworks, tab]);

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

  // Available lender/borrower museums
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

  const handleDrillDown = useCallback((artworkId: string) => {
    setArtworkId(artworkId);
    setTab('journey');
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  const showArtworkPicker = tab === 'journey';

  const filtersContent = (
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
      showArtworkPicker={showArtworkPicker}
    />
  );

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header area */}
      <div className="space-y-5">
        {/* Row 1: Back + Title */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 shrink-0 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              {isMobile ? 'Back' : 'Back to Art Collection'}
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <h1 className="font-display text-xl font-bold text-foreground md:text-2xl truncate hidden sm:block">
              Artwork Mobility
            </h1>
          </div>
          {/* Mobile filter toggle */}
          {isMobile && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="shrink-0 gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          )}
        </div>

        {/* Row 2: View Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as MobilityTab)}>
          <TabsList className={cn("h-10", isMobile ? 'w-full' : '')}>
            <TabsTrigger value="overview" className={cn("px-5", isMobile && 'flex-1')}>
              Artist Overview
            </TabsTrigger>
            <TabsTrigger value="journey" className={cn("px-5", isMobile && 'flex-1')}>
              Artwork Journey
            </TabsTrigger>
            <TabsTrigger value="balance" className={cn("px-5", isMobile && 'flex-1')}>
              Museum Balance
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Desktop filters */}
        {!isMobile && filtersContent}

        {/* Mobile filters panel */}
        {isMobile && mobileFiltersOpen && (
          <div className="rounded-xl border border-border/60 bg-card p-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-7 w-7"
              onClick={() => setMobileFiltersOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {filtersContent}
          </div>
        )}
      </div>

      {/* Views */}
      {tab === 'overview' && (
        <ArtistOverviewView
          movements={filteredMovements}
          museumMap={museumMap}
          artworks={artworks}
          onDrillDown={handleDrillDown}
        />
      )}

      {tab === 'journey' && (
        <ArtworkJourneyView
          artwork={selectedArtwork}
          movements={filteredMovements}
          museumMap={museumMap}
          mobilityStatus={mobilityStatus}
          mobilityNote={mobilityNote}
        />
      )}

      {tab === 'balance' && (
        <MuseumBalanceView
          movements={filteredMovements}
          museumMap={museumMap}
          artworks={artworks}
        />
      )}
    </div>
  );
}
