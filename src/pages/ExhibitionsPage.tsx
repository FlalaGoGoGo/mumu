import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, ImageOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useExhibitionsPage } from '@/hooks/useExhibitions';
import { useMuseums } from '@/hooks/useMuseums';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePreferences } from '@/hooks/usePreferences';
import { useDebounce } from '@/hooks/useDebounce';
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
  const { data: museums, isLoading: museumsLoading } = useMuseums();
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const { preferences } = usePreferences();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);
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

  // Pagination
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Math.max(1, isNaN(urlPage) ? 1 : urlPage);

  // Server-side paginated query
  const { data: pageResult, isLoading: exhibitionsLoading, error: exhibitionsError } = useExhibitionsPage({
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || null,
    country: selectedRegion,
    state: selectedStateProvince,
    city: selectedCity,
    statuses: selectedStatuses.length > 0 && selectedStatuses.length < USER_VISIBLE_STATUSES.length
      ? selectedStatuses : null,
    closingSoon,
    dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : null,
    dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : null,
  });

  const exhibitions = pageResult?.data ?? [];
  const totalCount = pageResult?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Museum lookup
  const museumMap = useMemo(() => {
    if (!museums) return new Map<string, Museum>();
    return new Map(museums.map(m => [m.museum_id, m]));
  }, [museums]);

  // Available locations for cascading filter
  const availableLocations = useMemo((): ExhibitionLocation[] => {
    if (!museums) return [];
    const locationSet = new Map<string, ExhibitionLocation>();
    museums.forEach(museum => {
      const country = museum.country || 'Unknown';
      const state = museum.state || null;
      const city = museum.city || 'Unknown';
      const key = `${country}|${state}|${city}`;
      if (!locationSet.has(key)) locationSet.set(key, { country, state, city });
    });
    return Array.from(locationSet.values());
  }, [museums]);

  // Add distance info to exhibitions
  const exhibitionsWithDistance = useMemo(() => {
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

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = Math.min(from + PAGE_SIZE, totalCount);

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
  }, [debouncedSearch, selectedRegion, selectedStateProvince, selectedCity, selectedStatuses, dateFrom, dateTo, maxDistance, closingSoon, dateSortOrder, distanceSortOrder]);

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

  const handleExhibitionClick = useCallback((exhibition: Exhibition) => {
    setSelectedExhibition(exhibition);
    setIsExhibitionOpen(true);
  }, []);

  const handleExhibitionClose = useCallback(() => {
    setIsExhibitionOpen(false);
    setSelectedExhibition(null);
    setIsArtworkOpen(false);
    setSelectedArtwork(null);
  }, []);

  const handleArtworkClick = useCallback((artwork: EnrichedArtwork) => {
    setSelectedArtwork(artwork);
    setIsArtworkOpen(true);
  }, []);

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
      }
    };
    document.addEventListener('keydown', handleEsc, true);
    return () => document.removeEventListener('keydown', handleEsc, true);
  }, [isArtworkOpen]);

  const getDistanceForExhibition = useCallback((exhibition: Exhibition) => {
    const entry = exhibitionsWithDistance.find(e => e.exhibition.exhibition_id === exhibition.exhibition_id);
    return entry?.distanceFormatted ?? null;
  }, [exhibitionsWithDistance]);

  // Filtered exhibitions as plain array for map
  const filteredExhibitionsList = useMemo(
    () => exhibitions,
    [exhibitions]
  );

  const userLocation = hasGeoLocation ? { latitude: latitude!, longitude: longitude! } : null;

  const isLoading = exhibitionsLoading || museumsLoading;

  if (isLoading && !pageResult) {
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
          {exhibitions.length === 0 && !exhibitionsLoading ? (
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
              {isPageChanging || exhibitionsLoading ? (
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
                  {exhibitionsWithDistance.map(({ exhibition, distanceFormatted }) => (
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

      {/* Exhibition Detail Panel */}
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

      {/* Artwork Detail Panel */}
      {isMobile ? (
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
