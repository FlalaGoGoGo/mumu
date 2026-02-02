import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useEnrichedArtworks } from '@/hooks/useArtworks';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArtworkCard } from '@/components/art/ArtworkCard';
import { ArtistPanel } from '@/components/art/ArtistPanel';
import { ArtistDrawer } from '@/components/art/ArtistDrawer';
import { ArtFilters, ArtFiltersState } from '@/components/art/ArtFilters';
import { ArtworkDetailSheet } from '@/components/art/ArtworkDetailSheet';
import { EnrichedArtwork, Artist } from '@/types/art';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export default function ArtPage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { data: artworks, artists, museums, isLoading } = useEnrichedArtworks();
  
  const [filters, setFilters] = useState<ArtFiltersState>({
    artType: null,
    artistId: null,
    museumId: null,
    onViewOnly: false,
  });
  
  const [selectedArtwork, setSelectedArtwork] = useState<EnrichedArtwork | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [artistDrawerOpen, setArtistDrawerOpen] = useState(false);

  // Get unique art types
  const artTypes = useMemo(() => {
    const types = new Set(artworks.map(a => a.art_type.toLowerCase()));
    return Array.from(types).sort();
  }, [artworks]);

  // Filter artworks
  const filteredArtworks = useMemo(() => {
    return artworks.filter(artwork => {
      if (filters.artType && artwork.art_type.toLowerCase() !== filters.artType.toLowerCase()) {
        return false;
      }
      if (filters.artistId && artwork.artist_id !== filters.artistId) {
        return false;
      }
      if (filters.museumId && artwork.museum_id !== filters.museumId) {
        return false;
      }
      if (filters.onViewOnly && !artwork.on_view) {
        return false;
      }
      return true;
    });
  }, [artworks, filters]);

  // Get selected artist
  const selectedArtist: Artist | null = useMemo(() => {
    if (!filters.artistId) return null;
    return artists.find(a => a.artist_id === filters.artistId) || null;
  }, [artists, filters.artistId]);

  const handleArtworkClick = (artwork: EnrichedArtwork) => {
    setSelectedArtwork(artwork);
    setDetailOpen(true);
  };

  const handleArtistClick = (artistId: string) => {
    setFilters(prev => ({ ...prev, artistId }));
  };

  const handleViewArtistDetails = () => {
    setArtistDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          {t('art.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('art.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <ArtFilters
          filters={filters}
          onFiltersChange={setFilters}
          artists={artists}
          museums={museums}
          artTypes={artTypes}
        />
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Artist Panel (Desktop) */}
        {!isMobile && selectedArtist && (
          <aside className="sticky top-24 hidden h-[calc(100vh-8rem)] w-72 shrink-0 overflow-hidden rounded-lg border border-border bg-card lg:block xl:w-80">
            <ArtistPanel artist={selectedArtist} />
          </aside>
        )}

        {/* Artwork Grid */}
        <div className="flex-1">
          {/* Mobile: Artist info button when artist is selected */}
          {isMobile && selectedArtist && (
            <Button
              variant="outline"
              className="mb-4 w-full justify-start gap-2"
              onClick={handleViewArtistDetails}
            >
              <User className="h-4 w-4" />
              <span className="truncate">{selectedArtist.artist_name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {t('art.viewDetails')}
              </span>
            </Button>
          )}

          {/* Results count */}
          <p className="mb-4 text-sm text-muted-foreground">
            {filteredArtworks.length} {t('art.artworks')}
          </p>

          {/* Grid */}
          {filteredArtworks.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredArtworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.artwork_id}
                  artwork={artwork}
                  onClick={() => handleArtworkClick(artwork)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">{t('art.noResults')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('art.tryAdjustingFilters')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Artwork Detail Sheet */}
      <ArtworkDetailSheet
        artwork={selectedArtwork}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onArtistClick={handleArtistClick}
      />

      {/* Mobile Artist Drawer */}
      <ArtistDrawer
        artist={selectedArtist}
        open={artistDrawerOpen}
        onOpenChange={setArtistDrawerOpen}
      />
    </div>
  );
}
