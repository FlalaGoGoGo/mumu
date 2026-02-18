import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, ImageOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { addDays } from 'date-fns';
import { useExhibitions } from '@/hooks/useExhibitions';
import { useMuseums } from '@/hooks/useMuseums';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExhibitionCard } from '@/components/exhibition/ExhibitionCard';
import { ExhibitionDetailPanel } from '@/components/exhibition/ExhibitionDetailPanel';
import { ArtworkDetailSheet } from '@/components/art/ArtworkDetailSheet';
import { ExhibitionFilters, DateSortOrder, DistanceSortOrder } from '@/components/exhibition/ExhibitionFilters';
import { ExhibitionMap } from '@/components/exhibition/ExhibitionMap';
import { ExhibitionMuseumDrawer } from '@/components/exhibition/ExhibitionMuseumDrawer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateDistance, formatDistance } from '@/lib/distance';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';
import type { EnrichedArtwork } from '@/types/art';
import type { ExhibitionLocation } from '@/components/exhibition/ExhibitionLocationFilter';
import type { ExhibitionView } from '@/components/exhibition/ExhibitionViewToggle';
import type { Museum } from '@/types/museum';

const USER_VISIBLE_STATUSES: ExhibitionStatus[] = ['Ongoing', 'Upcoming', 'Past'];
const STATUS_PRIORITY: Record<ExhibitionStatus, number> = { Ongoing: 0, Upcoming: 1, Past: 2, TBD: 3 };
const MAX_DISTANCE_VALUE = 500;
const VIEW_STORAGE_KEY = 'mumu-exhibitions-view';
const PAGE_SIZE = 20;

function getStoredView(): ExhibitionView {
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY);
    if (v === 'map' || v === 'card') return v;
  } catch {}
  return 'card';
}

export default function ExhibitionsPage() {
  const { data: exhibitions, isLoading: exhibitionsLoading, error: exhibitionsError } = useExhibitions();
  const { data: museums, isLoading: museumsLoading } = useMuseums();
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const { preferences } = usePreferences();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedStateProvince, setSelectedStateProvince] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<ExhibitionStatus[]>(['Ongoing', 'Upcoming', 'Past']);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [maxDistance, setMaxDistance] = useState(MAX_DISTANCE_VALUE);
  const [closingSoon, setClosingSoon] = useState(false);
  const [dateSortOrder, setDateSortOrder] = useState<DateSortOrder>('none');
  const [distanceSortOrder, setDistanceSortOrder] = useState<DistanceSortOrder>('none');
  const [currentView, setCurrentView] = useState<ExhibitionView>(getStoredView);
  const [isPageChanging, setIsPageChanging] = useState(false);

  // Exhibition detail panel state
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [isExhibitionOpen, setIsExhibitionOpen] = useState(false);

  // Artwork detail panel state
  const [selectedArtwork, setSelectedArtwork] = useState<EnrichedArtwork | null>(null);
  const [isArtworkOpen, setIsArtworkOpen] = useState(false);

  // Map drawer state
  const [selectedMuseumGroup, setSelectedMuseumGroup] = useState<{ museum: Museum; exhibitions: Exhibition[] } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Persist view
  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, currentView);
  }, [currentView]);

  const hasGeoLocation = latitude !== null && longitude !== null;
  const hasHomeBase = !!(preferences.location_country && preferences.location_city);
  const effectiveLat = latitude ?? null;
  const effectiveLng = longitude ?? null;
  const hasLocation = effectiveLat !== null && effectiveLng !== null;

  // Museum lookup
  const museumMap = useMemo(() => {
    if (!museums) return new Map<string, Museum>();
    return new Map(museums.map(m => [m.museum_id, m]));
  }, [museums]);

  // Available locations for cascading filter
  const availableLocations = useMemo((): ExhibitionLocation[] => {
    if (!exhibitions) return [];
    const locationSet = new Map<string, ExhibitionLocation>();
    exhibitions.forEach(exhibition => {
      const museum = museumMap.get(exhibition.museum_id);
      const country = museum?.country || 'Unknown';
      const state = museum?.state || exhibition.state || null;
      const city = exhibition.city || museum?.city || 'Unknown';
      const key = `${country}|${state}|${city}`;
      if (!locationSet.has(key)) locationSet.set(key, { country, state, city });
    });
    return Array.from(locationSet.values());
  }, [exhibitions, museumMap]);

  // Exhibitions with distance
  const exhibitionsWithDistance = useMemo(() => {
    if (!exhibitions) return [];
    return exhibitions.map(exhibition => {
      const museum = museumMap.get(exhibition.museum_id);
      let distance: number | null = null;
      let distanceFormatted: string | null = null;
      if (hasLocation && museum) {
        distance = calculateDistance(effectiveLat!, effectiveLng!, museum.lat, museum.lng);
        distanceFormatted = formatDistance(distance);
      }
      return { exhibition, distance, distanceFormatted, museum };
    });
  }, [exhibitions, museumMap, hasLocation, effectiveLat, effectiveLng]);

  // Filter and sort
  const filteredExhibitions = useMemo(() => {
    if (!exhibitionsWithDistance.length) return [];
    let filtered = exhibitionsWithDistance;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(({ exhibition }) =>
        exhibition.exhibition_name.toLowerCase().includes(query) ||
        exhibition.museum_name.toLowerCase().includes(query)
      );
    }

    if (selectedRegion) {
      filtered = filtered.filter(({ museum, exhibition }) => {
        const country = museum?.country || 'Unknown';
        if (country !== selectedRegion) return false;
        if (selectedStateProvince) {
          const state = museum?.state || exhibition.state || null;
          if (state !== selectedStateProvince) return false;
          if (selectedCity) {
            const city = exhibition.city || museum?.city || 'Unknown';
            if (city !== selectedCity) return false;
          }
        }
        return true;
      });
    }

    if (selectedStatuses.length > 0 && selectedStatuses.length < USER_VISIBLE_STATUSES.length) {
      filtered = filtered.filter(({ exhibition }) => selectedStatuses.includes(exhibition.status));
    }

    if (dateFrom || dateTo) {
      filtered = filtered.filter(({ exhibition }) => {
        const { start_date, end_date } = exhibition;
        if (!start_date && !end_date) return false;
        const rangeStart = dateFrom?.getTime() ?? 0;
        const rangeEnd = dateTo?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const exhibitStart = start_date?.getTime() ?? 0;
        const exhibitEnd = end_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return exhibitStart <= rangeEnd && exhibitEnd >= rangeStart;
      });
    }

    if (closingSoon) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const closingSoonCutoff = addDays(today, 14);
      filtered = filtered.filter(({ exhibition }) => {
        if (!exhibition.end_date) return false;
        return exhibition.end_date >= today && exhibition.end_date <= closingSoonCutoff;
      });
    }

    if (hasLocation && maxDistance < MAX_DISTANCE_VALUE) {
      filtered = filtered.filter(({ distance }) => distance !== null && distance <= maxDistance);
    }

    const sortedFiltered = [...filtered].sort((a, b) => {
      if (distanceSortOrder !== 'none' && hasLocation) {
        const distA = a.distance ?? Number.MAX_SAFE_INTEGER;
        const distB = b.distance ?? Number.MAX_SAFE_INTEGER;
        const distDiff = distanceSortOrder === 'asc' ? distA - distB : distB - distA;
        if (distDiff !== 0) return distDiff;
      }
      if (dateSortOrder !== 'none') {
        const dateA = a.exhibition.start_date?.getTime();
        const dateB = b.exhibition.start_date?.getTime();
        if (dateA === undefined && dateB === undefined) return 0;
        if (dateA === undefined) return 1;
        if (dateB === undefined) return -1;
        const dateDiff = dateSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        if (dateDiff !== 0) return dateDiff;
      }
      // Group by status: Ongoing → Upcoming → Past → TBD
      const statusDiff = STATUS_PRIORITY[a.exhibition.status] - STATUS_PRIORITY[b.exhibition.status];
      if (statusDiff !== 0) return statusDiff;
      // Within-group sorting
      if (a.exhibition.status === 'Ongoing') {
        const aEnd = a.exhibition.end_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bEnd = b.exhibition.end_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aEnd - bEnd; // ending sooner first
      }
      if (a.exhibition.status === 'Upcoming') {
        const aStart = a.exhibition.start_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bStart = b.exhibition.start_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aStart - bStart; // soonest first
      }
      if (a.exhibition.status === 'Past') {
        const aEnd = a.exhibition.end_date?.getTime() ?? 0;
        const bEnd = b.exhibition.end_date?.getTime() ?? 0;
        return bEnd - aEnd; // most recently ended first
      }
      return 0;
    });

    return sortedFiltered;
  }, [exhibitionsWithDistance, searchQuery, selectedRegion, selectedStateProvince, selectedCity, selectedStatuses, dateFrom, dateTo, maxDistance, hasLocation, closingSoon, dateSortOrder, distanceSortOrder]);

  // Pagination
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const totalCount = filteredExhibitions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(isNaN(urlPage) ? 1 : urlPage, totalPages));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = Math.min(from + PAGE_SIZE, totalCount);

  const paginatedExhibitions = useMemo(() => {
    return filteredExhibitions.slice(from, to);
  }, [filteredExhibitions, from, to]);

  const setPage = useCallback((newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (clamped === 1) next.delete('page');
      else next.set('page', String(clamped));
      return next;
    }, { replace: true });
    setIsPageChanging(true);
    setTimeout(() => {
      setIsPageChanging(false);
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [totalPages, setSearchParams]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage > 1) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('page');
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedRegion, selectedStateProvince, selectedCity, selectedStatuses, dateFrom, dateTo, maxDistance, closingSoon, dateSortOrder, distanceSortOrder]);

  // Build page numbers
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  // Filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedRegion) count++;
    if (selectedStatuses.length > 0 && selectedStatuses.length < USER_VISIBLE_STATUSES.length) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (hasLocation && maxDistance < MAX_DISTANCE_VALUE) count++;
    if (closingSoon) count++;
    return count;
  }, [selectedRegion, selectedStatuses, dateFrom, dateTo, maxDistance, hasLocation, closingSoon]);

  const hasActiveFilters = searchQuery !== '' || activeFilterCount > 0;

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRegion(null);
    setSelectedStateProvince(null);
    setSelectedCity(null);
    setSelectedStatuses(['Ongoing', 'Upcoming', 'Past']);
    setDateFrom(undefined);
    setDateTo(undefined);
    setMaxDistance(MAX_DISTANCE_VALUE);
    setClosingSoon(false);
  };

  const handleLocationChange = (region: string | null, stateProvince: string | null, city: string | null) => {
    setSelectedRegion(region);
    setSelectedStateProvince(stateProvince);
    setSelectedCity(city);
  };

  const handleSelectMuseumGroup = useCallback((group: { museum: Museum; exhibitions: Exhibition[] }) => {
    setSelectedMuseumGroup(group);
    setIsDrawerOpen(true);
  }, []);

  // Open exhibition panel (from card click or map drawer)
  const handleExhibitionClick = useCallback((exhibition: Exhibition) => {
    setSelectedExhibition(exhibition);
    setIsExhibitionOpen(true);
  }, []);

  // Close exhibition panel → also close artwork
  const handleExhibitionClose = useCallback(() => {
    setIsExhibitionOpen(false);
    setSelectedExhibition(null);
    setIsArtworkOpen(false);
    setSelectedArtwork(null);
  }, []);

  // Open artwork panel from Related Artworks
  const handleArtworkClick = useCallback((artwork: EnrichedArtwork) => {
    setSelectedArtwork(artwork);
    setIsArtworkOpen(true);
  }, []);

  // Close artwork panel only
  const handleArtworkClose = useCallback((open: boolean) => {
    if (!open) {
      setIsArtworkOpen(false);
      setSelectedArtwork(null);
    }
  }, []);

  // ESC key: close artwork first, then exhibition
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isArtworkOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsArtworkOpen(false);
          setSelectedArtwork(null);
        }
        // Exhibition panel handles its own ESC when artwork is not open
      }
    };
    // Use capture to intercept before the Sheet's own ESC handler
    document.addEventListener('keydown', handleEsc, true);
    return () => document.removeEventListener('keydown', handleEsc, true);
  }, [isArtworkOpen]);

  const getDistanceForExhibition = useCallback((exhibition: Exhibition) => {
    const entry = exhibitionsWithDistance.find(e => e.exhibition.exhibition_id === exhibition.exhibition_id);
    return entry?.distanceFormatted ?? null;
  }, [exhibitionsWithDistance]);

  // Filtered exhibitions as plain array for map
  const filteredExhibitionsList = useMemo(
    () => filteredExhibitions.map(e => e.exhibition),
    [filteredExhibitions]
  );

  const userLocation = hasGeoLocation ? { latitude: latitude!, longitude: longitude! } : null;

  const isLoading = exhibitionsLoading || museumsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (exhibitionsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <ImageOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-display text-xl font-semibold mb-2">{t('exhibitions.failedToLoad')}</h2>
        <p className="text-muted-foreground">{t('exhibitions.tryAgainLater')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          {t('exhibitions.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('exhibitions.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <ExhibitionFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          availableLocations={availableLocations}
          selectedRegion={selectedRegion}
          selectedStateProvince={selectedStateProvince}
          selectedCity={selectedCity}
          onLocationChange={handleLocationChange}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          hasLocation={hasLocation}
          hasHomeBase={hasHomeBase}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          closingSoon={closingSoon}
          onClosingSoonChange={setClosingSoon}
          dateSortOrder={dateSortOrder}
          onDateSortOrderChange={setDateSortOrder}
          distanceSortOrder={distanceSortOrder}
          onDistanceSortOrderChange={setDistanceSortOrder}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>

      {/* Card View */}
      {currentView === 'card' && (
        <>
          <div ref={gridRef} />
          {filteredExhibitions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ImageOff className="w-12 h-12 text-muted-foreground mb-4" />
              <h2 className="font-display text-xl font-semibold mb-2">{t('exhibitions.noResults')}</h2>
              <p className="text-muted-foreground mb-4">{t('exhibitions.noResultsHint')}</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  {t('common.clearFilters')}
                </Button>
              )}
            </div>
          ) : (
            <>
              {isPageChanging ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <div key={i} className="flex flex-col overflow-hidden rounded-sm border border-border">
                      <Skeleton className="w-full h-48" />
                      <div className="p-3 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {paginatedExhibitions.map(({ exhibition, distanceFormatted }) => (
                    <ExhibitionCard
                      key={exhibition.exhibition_id}
                      exhibition={exhibition}
                      distance={distanceFormatted}
                      onClick={() => handleExhibitionClick(exhibition)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-3 mt-8 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {from + 1}–{to} of {totalCount}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setPage(1)}>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {pageNumbers.map((p, i) =>
                      p === 'ellipsis' ? (
                        <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === currentPage ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Map View */}
      {currentView === 'map' && (
        <ExhibitionMap
          exhibitions={filteredExhibitionsList}
          museumMap={museumMap}
          onSelectMuseum={handleSelectMuseumGroup}
          userLocation={userLocation}
        />
      )}

      {/* Museum Exhibitions Drawer (Map View) */}
      <ExhibitionMuseumDrawer
        group={selectedMuseumGroup}
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedMuseumGroup(null); }}
        onExhibitionClick={handleExhibitionClick}
      />

      {/* Exhibition Detail Panel (left side on desktop, fullscreen on mobile) */}
      <ExhibitionDetailPanel
        exhibition={selectedExhibition}
        open={isExhibitionOpen}
        onClose={handleExhibitionClose}
        onArtworkClick={handleArtworkClick}
        museumWebsiteUrl={
          selectedExhibition
            ? museumMap.get(selectedExhibition.museum_id)?.website_url
            : null
        }
      />

      {/* Artwork Detail Panel (right side, above exhibition panel) */}
      {isMobile ? (
        // Mobile: full-screen artwork panel when open
        isArtworkOpen && selectedArtwork && (
          <ArtworkDetailSheet
            artwork={selectedArtwork}
            open={isArtworkOpen}
            onOpenChange={handleArtworkClose}
          />
        )
      ) : (
        <ArtworkDetailSheet
          artwork={selectedArtwork}
          open={isArtworkOpen}
          onOpenChange={handleArtworkClose}
        />
      )}
    </div>
  );
}
