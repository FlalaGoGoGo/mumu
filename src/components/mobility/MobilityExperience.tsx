import { useState, useMemo, useCallback } from 'react';
import { useArtworkMovements } from '@/hooks/useArtworkMovements';
import { useEnrichedArtworks } from '@/hooks/useArtworks';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, SlidersHorizontal, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MobilityFilters } from './MobilityFilters';
import { ArtistOverviewView } from './ArtistOverviewView';
import { FlowOverTimeView } from './FlowOverTimeView';
import { MuseumExplorerView } from './MuseumExplorerView';
import { NetworkGraph3D } from './NetworkGraph3D';
import { ArtworkDetailDrawer } from './ArtworkDetailDrawer';
import { getCountryFlag } from '@/lib/countryFlag';
import type { MobilityResearchStatus } from '@/types/movement';
import type { Artist } from '@/types/art';

type MobilityTab = 'flow' | 'time' | 'museum' | 'network';

interface Props {
  onBack: () => void;
}

/** Artist profile intro block */
function ArtistIntro({ artist }: { artist: Artist }) {
  const flag = getCountryFlag(artist.nationality);
  const lifeSpan = [artist.birth_year, artist.death_year].filter(Boolean).join('–');

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-4 flex items-start gap-4">
        {artist.portrait_url ? (
          <img src={artist.portrait_url} alt={artist.artist_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-border/60 shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border/60 shrink-0">
            <User className="h-7 w-7 text-muted-foreground/40" />
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold truncate">{flag} {artist.artist_name}</h3>
          <div className="flex flex-wrap items-center gap-2">
            {artist.nationality && <Badge variant="secondary" className="text-[10px]">{artist.nationality}</Badge>}
            {lifeSpan && <span className="text-xs text-muted-foreground tabular-nums">{lifeSpan}</span>}
            {artist.movement && <Badge variant="outline" className="text-[10px]">{artist.movement}</Badge>}
          </div>
          {artist.bio && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{artist.bio}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function MobilityExperience({ onBack }: Props) {
  const isMobile = useIsMobile();
  const { data: movements = [], isLoading: movLoading } = useArtworkMovements();
  const { data: artworks, artists, museums, isLoading: artLoading } = useEnrichedArtworks();

  const [tab, setTab] = useState<MobilityTab>('flow');
  const [artistId, setArtistId] = useState<string>('vincent-van-gogh');
  const [yearRange, setYearRange] = useState<[number, number]>([1800, 2030]);
  const [lenderMuseumId, setLenderMuseumId] = useState<string | null>(null);
  const [borrowerMuseumId, setBorrowerMuseumId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [detailArtworkId, setDetailArtworkId] = useState<string | null>(null);

  const isLoading = movLoading || artLoading;

  const artistArtworks = useMemo(() => artistId ? artworks.filter(a => a.artist_id === artistId) : [], [artworks, artistId]);

  const selectedArtist = useMemo(() => artists.find(a => a.artist_id === artistId) || null, [artists, artistId]);

  const filteredMovements = useMemo(() => {
    let result = movements;
    if (artistId) result = result.filter(m => m.artist_id === artistId);
    if (lenderMuseumId) result = result.filter(m => m.lender_museum_id === lenderMuseumId);
    if (borrowerMuseumId) result = result.filter(m => m.borrower_museum_id === borrowerMuseumId);
    result = result.filter(m => {
      if (!m.start_date) return true;
      const year = parseInt(m.start_date.substring(0, 4));
      return !isNaN(year) && year >= yearRange[0] && year <= yearRange[1];
    });
    return result.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  }, [movements, artistId, lenderMuseumId, borrowerMuseumId, yearRange]);

  const museumMap = useMemo(() => {
    const map = new Map<string, { museum_id: string; name: string; lat: number; lng: number }>();
    for (const m of museums) map.set(m.museum_id, { museum_id: m.museum_id, name: m.name, lat: m.lat, lng: m.lng });
    return map;
  }, [museums]);

  const lenderMuseums = useMemo(() => {
    const ids = new Set(movements.filter(m => !artistId || m.artist_id === artistId).map(m => m.lender_museum_id));
    return museums.filter(m => ids.has(m.museum_id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [movements, museums, artistId]);

  const borrowerMuseums = useMemo(() => {
    const ids = new Set(movements.filter(m => !artistId || m.artist_id === artistId).map(m => m.borrower_museum_id));
    return museums.filter(m => ids.has(m.museum_id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [movements, museums, artistId]);

  const handleOpenArtworkDetail = useCallback((artworkId: string) => {
    try { setDetailArtworkId(artworkId); } catch { /* prevent crash */ }
  }, []);

  const detailArtwork = useMemo(() => detailArtworkId ? artworks.find(a => a.artwork_id === detailArtworkId) || null : null, [artworks, detailArtworkId]);
  const detailMovements = useMemo(() => detailArtworkId ? filteredMovements.filter(m => m.artwork_id === detailArtworkId) : [], [filteredMovements, detailArtworkId]);
  const detailMobilityStatus: MobilityResearchStatus = detailArtwork ? ((detailArtwork as any).mobility_research_status as MobilityResearchStatus) || 'NOT_RESEARCHED' : 'NOT_RESEARCHED';
  const detailMobilityNote: string = detailArtwork ? ((detailArtwork as any).mobility_research_note as string) || '' : '';

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  const filtersContent = (
    <MobilityFilters
      artists={artists} artistId={artistId}
      onArtistChange={(id) => { setArtistId(id); setDetailArtworkId(null); }}
      artworks={artistArtworks} artworkId={null} onArtworkChange={() => {}}
      yearRange={yearRange} onYearRangeChange={setYearRange}
      lenderMuseums={lenderMuseums} lenderMuseumId={lenderMuseumId} onLenderMuseumChange={setLenderMuseumId}
      borrowerMuseums={borrowerMuseums} borrowerMuseumId={borrowerMuseumId} onBorrowerMuseumChange={setBorrowerMuseumId}
      showArtworkPicker={false}
    />
  );

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* 1. Page Header — matches Arts / Exhibitions pattern */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Artwork Mobility
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore how artworks travel between museums worldwide
          </p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          {isMobile ? 'Back' : 'Back to Art Collection'}
        </Button>
      </div>

      {/* 2. Artist Selector (mobile filter toggle) */}
      <div className="flex items-center gap-2">
        {isMobile && (
          <Button variant="outline" size="sm" onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)} className="shrink-0 gap-2">
            <SlidersHorizontal className="h-4 w-4" />Filters
          </Button>
        )}
      </div>

      {/* Filters — desktop inline, mobile collapsible */}
      {!isMobile && filtersContent}
      {isMobile && mobileFiltersOpen && (
        <div className="rounded-xl border border-border/60 bg-card p-4 relative">
          <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-7 w-7" onClick={() => setMobileFiltersOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
          {filtersContent}
        </div>
      )}

      {/* 3. Artist Profile / Intro */}
      {selectedArtist && <ArtistIntro artist={selectedArtist} />}

      {/* 4. Mode Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as MobilityTab)}>
        <TabsList className={cn("h-10", isMobile ? 'w-full' : '')}>
          <TabsTrigger value="flow" className={cn("px-5", isMobile && 'flex-1')}>All Works Flow</TabsTrigger>
          <TabsTrigger value="time" className={cn("px-5", isMobile && 'flex-1')}>Flow Over Time</TabsTrigger>
          <TabsTrigger value="network" className={cn("px-5", isMobile && 'flex-1')}>3D Network</TabsTrigger>
          <TabsTrigger value="museum" className={cn("px-5", isMobile && 'flex-1')}>Museum Explorer</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 5. Tab Content */}
      {tab === 'flow' && (
        <ArtistOverviewView movements={filteredMovements} museumMap={museumMap} artworks={artworks} onDrillDown={handleOpenArtworkDetail} selectedArtist={null} museums={museums} />
      )}
      {tab === 'time' && (
        <FlowOverTimeView movements={filteredMovements} museumMap={museumMap} artworks={artworks} onArtworkSelect={handleOpenArtworkDetail} />
      )}
      {tab === 'museum' && (
        <MuseumExplorerView movements={filteredMovements} museumMap={museumMap} artworks={artworks} museums={museums} onArtworkSelect={handleOpenArtworkDetail} />
      )}
      {tab === 'network' && (
        <NetworkGraph3D movements={filteredMovements} museumMap={museumMap} artworks={artworks} onArtworkSelect={handleOpenArtworkDetail} />
      )}

      <ArtworkDetailDrawer
        open={detailArtworkId !== null}
        onOpenChange={(open) => { if (!open) setDetailArtworkId(null); }}
        artwork={detailArtwork}
        movements={detailMovements}
        museumMap={museumMap}
        mobilityStatus={detailMobilityStatus}
        mobilityNote={detailMobilityNote}
      />
    </div>
  );
}
