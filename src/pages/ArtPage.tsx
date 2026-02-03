import { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useEnrichedArtworks } from '@/hooks/useArtworks';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArtworkCard } from '@/components/art/ArtworkCard';
import { ArtistPanel } from '@/components/art/ArtistPanel';
import { ArtistDrawer } from '@/components/art/ArtistDrawer';
import { ArtFilters, ArtFiltersState, SortOrder } from '@/components/art/ArtFilters';
import { ArtworkDetailSheet } from '@/components/art/ArtworkDetailSheet';
import { EnrichedArtwork, Artist, hasReliableImage, getArtworkImageUrl } from '@/types/art';
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
    mustSeeOnly: false,
    hasImageOnly: false,
  });
  
  const [selectedArtwork, setSelectedArtwork] = useState<EnrichedArtwork | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [artistDrawerOpen, setArtistDrawerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Get unique art types
  const artTypes = useMemo(() => {
    const types = new Set(artworks.map(a => a.art_type.toLowerCase()));
    return Array.from(types).sort();
  }, [artworks]);

  // Helper to check if artwork has valid image (for display purposes)
  // Uses cached URL for reliability, falls back to source URL
  const hasValidImage = (artwork: EnrichedArtwork) => {
    // Prefer cached URL for reliable "Has Image" filtering
    if (hasReliableImage(artwork)) return true;
    // Fallback to source URL check (less reliable but better than nothing)
    return !!(artwork.image_url && artwork.image_url.trim());
  };

  // Filter artworks without artist filter (for artist counts)
  const artworksWithoutArtistFilter = useMemo(() => {
    return artworks.filter(artwork => {
      if (filters.artType && artwork.art_type.toLowerCase() !== filters.artType.toLowerCase()) {
        return false;
      }
      if (filters.museumId && artwork.museum_id !== filters.museumId) {
        return false;
      }
      if (filters.onViewOnly && !artwork.on_view) {
        return false;
      }
      if (filters.mustSeeOnly && !artwork.highlight) {
        return false;
      }
      if (filters.hasImageOnly && !hasValidImage(artwork)) {
        return false;
      }
      return true;
    });
  }, [artworks, filters.artType, filters.museumId, filters.onViewOnly, filters.mustSeeOnly, filters.hasImageOnly]);

  // Filter artworks without museum filter (for museum counts)
  const artworksWithoutMuseumFilter = useMemo(() => {
    return artworks.filter(artwork => {
      if (filters.artType && artwork.art_type.toLowerCase() !== filters.artType.toLowerCase()) {
        return false;
      }
      if (filters.artistId && artwork.artist_id !== filters.artistId) {
        return false;
      }
      if (filters.onViewOnly && !artwork.on_view) {
        return false;
      }
      if (filters.mustSeeOnly && !artwork.highlight) {
        return false;
      }
      if (filters.hasImageOnly && !hasValidImage(artwork)) {
        return false;
      }
      return true;
    });
  }, [artworks, filters.artType, filters.artistId, filters.onViewOnly, filters.mustSeeOnly, filters.hasImageOnly]);

  // Compute on-view count (excluding onViewOnly filter itself)
  const onViewCount = useMemo(() => {
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
      if (filters.mustSeeOnly && !artwork.highlight) {
        return false;
      }
      if (filters.hasImageOnly && !hasValidImage(artwork)) {
        return false;
      }
      return artwork.on_view === true;
    }).length;
  }, [artworks, filters.artType, filters.artistId, filters.museumId, filters.mustSeeOnly, filters.hasImageOnly]);

  // Compute must-see count (excluding mustSeeOnly filter itself)
  const mustSeeCount = useMemo(() => {
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
      if (filters.hasImageOnly && !hasValidImage(artwork)) {
        return false;
      }
      return artwork.highlight === true;
    }).length;
  }, [artworks, filters.artType, filters.artistId, filters.museumId, filters.onViewOnly, filters.hasImageOnly]);

  // Compute has-image count (excluding hasImageOnly filter itself)
  const hasImageCount = useMemo(() => {
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
      if (filters.mustSeeOnly && !artwork.highlight) {
        return false;
      }
      return hasValidImage(artwork);
    }).length;
  }, [artworks, filters.artType, filters.artistId, filters.museumId, filters.onViewOnly, filters.mustSeeOnly]);

  // Compute artist counts
  const artistCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const artwork of artworksWithoutArtistFilter) {
      counts.set(artwork.artist_id, (counts.get(artwork.artist_id) || 0) + 1);
    }
    return counts;
  }, [artworksWithoutArtistFilter]);

  // Compute museum counts
  const museumCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const artwork of artworksWithoutMuseumFilter) {
      counts.set(artwork.museum_id, (counts.get(artwork.museum_id) || 0) + 1);
    }
    return counts;
  }, [artworksWithoutMuseumFilter]);

  // Get museums that have artworks in the current filtered set
  const availableMuseums = useMemo(() => {
    const museumIds = new Set(artworksWithoutMuseumFilter.map(a => a.museum_id));
    return museums.filter(m => museumIds.has(m.museum_id));
  }, [artworksWithoutMuseumFilter, museums]);

  // Get artists that have artworks in the current filtered set
  const availableArtists = useMemo(() => {
    const artistIds = new Set(artworksWithoutArtistFilter.map(a => a.artist_id));
    return artists.filter(a => artistIds.has(a.artist_id));
  }, [artworksWithoutArtistFilter, artists]);

  // Final filtered artworks (including all filters) with sorting
  const filteredArtworks = useMemo(() => {
    const filtered = artworksWithoutMuseumFilter.filter(artwork => {
      if (filters.museumId && artwork.museum_id !== filters.museumId) {
        return false;
      }
      return true;
    });
    
    // Apply sorting by title (case-insensitive, locale-aware)
    return filtered.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [artworksWithoutMuseumFilter, filters.museumId, sortOrder]);

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
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          artists={availableArtists}
          museums={availableMuseums}
          artTypes={artTypes}
          artistCounts={artistCounts}
          museumCounts={museumCounts}
          totalArtistCount={artworksWithoutArtistFilter.length}
          totalMuseumCount={artworksWithoutMuseumFilter.length}
          onViewCount={onViewCount}
          mustSeeCount={mustSeeCount}
          hasImageCount={hasImageCount}
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

          {/* Grid - adaptive columns based on whether artist panel is visible */}
          {filteredArtworks.length > 0 ? (
            <div className={
              selectedArtist && !isMobile
                ? "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
            }>
              {filteredArtworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.artwork_id}
                  artwork={artwork}
                  onClick={() => handleArtworkClick(artwork)}
                  compact={!!selectedArtist && !isMobile}
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
