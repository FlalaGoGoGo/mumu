import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { useEnrichedArtworks } from '@/hooks/useArtworks';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArtworkCard } from '@/components/art/ArtworkCard';
import { ArtistPanel } from '@/components/art/ArtistPanel';
import { ArtistDrawer } from '@/components/art/ArtistDrawer';
import { ArtFilters, ArtFiltersState, SortOrder } from '@/components/art/ArtFilters';
import { ArtworkDetailSheet } from '@/components/art/ArtworkDetailSheet';
import { ArtistWorksMap } from '@/components/art/ArtistWorksMap';
import { ArtMapView } from '@/components/art/ArtMapView';
import { ArtMuseumDrawer, type ArtMuseumGroup } from '@/components/art/ArtMuseumDrawer';
import type { ArtView } from '@/components/art/ArtViewToggle';

import { EnrichedArtwork, Artist, getArtworkImageUrl } from '@/types/art';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useImageLoad } from '@/contexts/ImageLoadContext';

const PAGE_SIZE = 64;

export default function ArtPage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { data: artworks, artists, museums, isLoading } = useEnrichedArtworks();
  const { loadedImageIds, hasVerifiedImage } = useImageLoad();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ArtView>('grid');

  // Pagination state synced with URL
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const gridRef = useRef<HTMLDivElement>(null);

  const setCurrentPage = useCallback((page: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (page <= 1) {
        next.delete('page');
      } else {
        next.set('page', String(page));
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Map drawer state
  const [selectedMuseumGroup, setSelectedMuseumGroup] = useState<ArtMuseumGroup | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search-filtered artworks (base for all other filters)
  const searchFilteredArtworks = useMemo(() => {
    if (!searchQuery.trim()) return artworks;
    const q = searchQuery.toLowerCase();
    return artworks.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.artist_name.toLowerCase().includes(q) ||
      a.museum_name.toLowerCase().includes(q)
    );
  }, [artworks, searchQuery]);

  // Get unique art types
  const artTypes = useMemo(() => {
    const types = new Set(searchFilteredArtworks.map(a => a.art_type.toLowerCase()));
    return Array.from(types).sort();
  }, [searchFilteredArtworks]);

  const hasVerifiedLoadedImage = (artwork: EnrichedArtwork) => {
    return hasVerifiedImage(artwork.artwork_id);
  };

  // Filter artworks without type filter (for type counts)
  const artworksWithoutTypeFilter = useMemo(() => {
    return searchFilteredArtworks.filter(artwork => {
      if (filters.artistId && artwork.artist_id !== filters.artistId) return false;
      if (filters.museumId && artwork.museum_id !== filters.museumId) return false;
      if (filters.onViewOnly && !artwork.on_view) return false;
      if (filters.mustSeeOnly && !artwork.highlight) return false;
      if (filters.hasImageOnly && !hasVerifiedLoadedImage(artwork)) return false;
      return true;
    });
  }, [searchFilteredArtworks, filters.artistId, filters.museumId, filters.onViewOnly, filters.mustSeeOnly, filters.hasImageOnly, loadedImageIds]);

  const artworksWithoutArtistFilter = useMemo(() => {
    return searchFilteredArtworks.filter(artwork => {
      if (filters.artType && artwork.art_type.toLowerCase() !== filters.artType.toLowerCase()) return false;
      if (filters.museumId && artwork.museum_id !== filters.museumId) return false;
      if (filters.onViewOnly && !artwork.on_view) return false;
      if (filters.mustSeeOnly && !artwork.highlight) return false;
      if (filters.hasImageOnly && !hasVerifiedLoadedImage(artwork)) return false;
      return true;
    });
  }, [searchFilteredArtworks, filters.artType, filters.museumId, filters.onViewOnly, filters.mustSeeOnly, filters.hasImageOnly, loadedImageIds]);

  const artworksWithoutMuseumFilter = useMemo(() => {
    return searchFilteredArtworks.filter(artwork => {
      if (filters.artType && artwork.art_type.toLowerCase() !== filters.artType.toLowerCase()) return false;
      if (filters.artistId && artwork.artist_id !== filters.artistId) return false;
      if (filters.onViewOnly && !artwork.on_view) return false;
      if (filters.mustSeeOnly && !artwork.highlight) return false;
      if (filters.hasImageOnly && !hasVerifiedLoadedImage(artwork)) return false;
      return true;
    });
  }, [searchFilteredArtworks, filters.artType, filters.artistId, filters.onViewOnly, filters.mustSeeOnly, filters.hasImageOnly, loadedImageIds]);

  // Compute counts
  const onViewCount = useMemo(() => {
    return searchFilteredArtworks.filter(artwork => {
      if (filters.artType && artwork.art_type.toLowerCase() !== filters.artType.toLowerCase()) return false;
      if (filters.artistId && artwork.artist_id !== filters.artistId) return false;
      if (filters.museumId && artwork.museum_id !== filters.museumId) return false;
      if (filters.mustSeeOnly && !artwork.highlight) return false;
      if (filters.hasImageOnly && !hasVerifiedLoadedImage(artwork)) return false;
      return artwork.on_view === true;
    }).length;
  }, [searchFilteredArtworks, filters.artType, filters.artistId, filters.museumId, filters.mustSeeOnly, filters.hasImageOnly, loadedImageIds]);

  const mustSeeCount = useMemo(() => {
    return searchFilteredArtworks.filter(artwork => {
      if (filters.artType && artwork.art_type.toLowerCase() !== filters.artType.toLowerCase()) return false;
      if (filters.artistId && artwork.artist_id !== filters.artistId) return false;
      if (filters.museumId && artwork.museum_id !== filters.museumId) return false;
      if (filters.onViewOnly && !artwork.on_view) return false;
      if (filters.hasImageOnly && !hasVerifiedLoadedImage(artwork)) return false;
      return artwork.highlight === true;
    }).length;
  }, [searchFilteredArtworks, filters.artType, filters.artistId, filters.museumId, filters.onViewOnly, filters.hasImageOnly, loadedImageIds]);

  const hasImageCount = useMemo(() => {
    return searchFilteredArtworks.filter(artwork => {
      if (filters.artType && artwork.art_type.toLowerCase() !== filters.artType.toLowerCase()) return false;
      if (filters.artistId && artwork.artist_id !== filters.artistId) return false;
      if (filters.museumId && artwork.museum_id !== filters.museumId) return false;
      if (filters.onViewOnly && !artwork.on_view) return false;
      if (filters.mustSeeOnly && !artwork.highlight) return false;
      return hasVerifiedLoadedImage(artwork);
    }).length;
  }, [searchFilteredArtworks, filters.artType, filters.artistId, filters.museumId, filters.onViewOnly, filters.mustSeeOnly, loadedImageIds]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const artwork of artworksWithoutTypeFilter) {
      const type = artwork.art_type.toLowerCase();
      counts.set(type, (counts.get(type) || 0) + 1);
    }
    return counts;
  }, [artworksWithoutTypeFilter]);

  const artistCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const artwork of artworksWithoutArtistFilter) {
      counts.set(artwork.artist_id, (counts.get(artwork.artist_id) || 0) + 1);
    }
    return counts;
  }, [artworksWithoutArtistFilter]);

  const museumCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const artwork of artworksWithoutMuseumFilter) {
      counts.set(artwork.museum_id, (counts.get(artwork.museum_id) || 0) + 1);
    }
    return counts;
  }, [artworksWithoutMuseumFilter]);

  const availableMuseums = useMemo(() => {
    const museumIds = new Set(artworksWithoutMuseumFilter.map(a => a.museum_id));
    return museums.filter(m => museumIds.has(m.museum_id));
  }, [artworksWithoutMuseumFilter, museums]);

  const availableArtists = useMemo(() => {
    const artistIds = new Set(artworksWithoutArtistFilter.map(a => a.artist_id));
    return artists.filter(a => artistIds.has(a.artist_id));
  }, [artworksWithoutArtistFilter, artists]);

  // Final filtered artworks with sorting
  const filteredArtworks = useMemo(() => {
    const filtered = artworksWithoutMuseumFilter.filter(artwork => {
      if (filters.museumId && artwork.museum_id !== filters.museumId) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [artworksWithoutMuseumFilter, filters.museumId, sortOrder]);

  const filteredArtworkIdSet = useMemo(() => {
    return new Set(filteredArtworks.map(a => a.artwork_id));
  }, [filteredArtworks]);

  // Pagination
  const totalCount = filteredArtworks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = Math.min(from + PAGE_SIZE, totalCount);

  const paginatedArtworks = useMemo(() => {
    return filteredArtworks.slice(from, to);
  }, [filteredArtworks, from, to]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [filters, searchQuery, sortOrder]);

  // Clamp page if it exceeds totalPages (e.g. after filtering reduces results)
  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Scroll to grid top on page change
  const prevPageRef = useRef(safePage);
  useEffect(() => {
    if (prevPageRef.current !== safePage && gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevPageRef.current = safePage;
  }, [safePage]);

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

  const handleSelectMuseum = useCallback((group: ArtMuseumGroup) => {
    setSelectedMuseumGroup(group);
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerArtworkClick = useCallback((artwork: EnrichedArtwork) => {
    setSelectedArtwork(artwork);
    setDetailOpen(true);
  }, []);

  // Page number generation with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
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

      {/* Toolbar + Filters */}
      <div className="sticky top-0 z-[1500] -mx-4 mb-4 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
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
          typeCounts={typeCounts}
          totalArtistCount={artworksWithoutArtistFilter.length}
          totalMuseumCount={artworksWithoutMuseumFilter.length}
          totalTypeCount={artworksWithoutTypeFilter.length}
          onViewCount={onViewCount}
          mustSeeCount={mustSeeCount}
          hasImageCount={hasImageCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          view={view}
          onViewChange={setView}
        />
      </div>

      {/* Grid View */}
      {view === 'grid' && (
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

            {/* Results count + range */}
            <div ref={gridRef} className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {totalCount} {t('art.artworks')}
              </p>
              {totalCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('art.showing')} {from + 1}–{to} {t('art.of')} {totalCount}
                </p>
              )}
            </div>

            {/* Grid */}
            {paginatedArtworks.length > 0 ? (
              <>
                <div className={
                  selectedArtist && !isMobile
                    ? "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                    : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
                }>
                  {paginatedArtworks.map((artwork) => (
                    <ArtworkCard
                      key={artwork.artwork_id}
                      artwork={artwork}
                      onClick={() => handleArtworkClick(artwork)}
                      compact={!!selectedArtist && !isMobile}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <nav
                    role="navigation"
                    aria-label="pagination"
                    className="mt-8 flex flex-col items-center gap-3"
                  >
                    <div className="flex items-center gap-1">
                      {/* First */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={safePage === 1}
                        onClick={() => setCurrentPage(1)}
                        aria-label={t('art.first')}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      {/* Previous */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 pl-2.5"
                        disabled={safePage === 1}
                        onClick={() => setCurrentPage(safePage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('art.previous')}</span>
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((p, i) =>
                          p === 'ellipsis' ? (
                            <span key={`e${i}`} className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                              …
                            </span>
                          ) : (
                            <Button
                              key={p}
                              variant={p === safePage ? 'default' : 'outline'}
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => setCurrentPage(p)}
                              aria-current={p === safePage ? 'page' : undefined}
                            >
                              {p}
                            </Button>
                          )
                        )}
                      </div>

                      {/* Next */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 pr-2.5"
                        disabled={safePage === totalPages}
                        onClick={() => setCurrentPage(safePage + 1)}
                      >
                        <span className="hidden sm:inline">{t('art.next')}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      {/* Last */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={safePage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        aria-label={t('art.last')}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </nav>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground">{t('art.noResults')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('art.tryAdjustingFilters')}
                </p>
              </div>
            )}

            {/* Artist Works Map - only shown when artist filter is active */}
            {selectedArtist && filteredArtworks.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
                  {t('art.worksOnMap')}
                </h2>
                <ArtistWorksMap 
                  artworks={filteredArtworks} 
                  artistName={selectedArtist.artist_name} 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map View */}
      {view === 'map' && (
        <div className={detailOpen ? 'pointer-events-none' : ''}>
          <ArtMapView
            artworks={filteredArtworks}
            onSelectMuseum={handleSelectMuseum}
            selectedGroup={selectedMuseumGroup}
            isDrawerOpen={isDrawerOpen}
            onCloseDrawer={() => { setIsDrawerOpen(false); setSelectedMuseumGroup(null); }}
            onArtworkClick={handleDrawerArtworkClick}
            filteredArtworkIds={filteredArtworkIdSet}
          />
        </div>
      )}

      {/* Art Museum Drawer — mobile only */}
      {isMobile && (
        <ArtMuseumDrawer
          group={selectedMuseumGroup}
          isOpen={isDrawerOpen}
          onClose={() => { setIsDrawerOpen(false); setSelectedMuseumGroup(null); }}
          onArtworkClick={handleDrawerArtworkClick}
          filteredArtworkIds={filteredArtworkIdSet}
        />
      )}

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
