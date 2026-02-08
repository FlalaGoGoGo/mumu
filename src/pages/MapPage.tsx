import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMuseums } from '@/hooks/useMuseums';
import { useVisits, useAddVisit, useRemoveVisit } from '@/hooks/usePassport';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MuseumMap } from '@/components/map/MuseumMap';
import { MuseumCard } from '@/components/museum/MuseumCard';
import { MobileBottomSheet } from '@/components/layout/MobileBottomSheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CategoryFilterDropdown, type MuseumCategory } from '@/components/map/CategoryFilterDropdown';
import { LocationFilter } from '@/components/map/LocationFilter';
import { DistanceFilter } from '@/components/map/DistanceFilter';
import { MustVisitFilter } from '@/components/map/MustVisitFilter';
import { ActiveFilters } from '@/components/map/ActiveFilters';
import { OpenTodayFilter } from '@/components/map/OpenTodayFilter';
import { WishListFilter } from '@/components/map/WishListFilter';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { useLanguage } from '@/lib/i18n';
import { isOpenToday } from '@/lib/parseOpeningHours';
import { useSavedMuseums } from '@/hooks/useSavedMuseums';
import type { Museum } from '@/types/museum';

export default function MapPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: museums = [], isLoading } = useMuseums();
  const { data: visits = [] } = useVisits();
  const addVisit = useAddVisit();
  const removeVisit = useRemoveVisit();
  const { latitude, longitude, accuracy } = useGeolocation(true);
  const { isSaved } = useSavedMuseums();
  
  const [selectedMuseum, setSelectedMuseum] = useState<Museum | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New filter states
  const [categoryFilter, setCategoryFilter] = useState<MuseumCategory[]>([]);
  const [locationCountry, setLocationCountry] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<string | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number | null>(null);
  const [mustVisitFilter, setMustVisitFilter] = useState(false);
  const [openTodayFilter, setOpenTodayFilter] = useState(false);
  const [wishListFilter, setWishListFilter] = useState(false);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter.length > 0) count++;
    if (locationCountry || locationState || locationCity) count++;
    if (maxDistanceFilter !== null) count++;
    if (mustVisitFilter) count++;
    if (openTodayFilter) count++;
    if (wishListFilter) count++;
    return count;
  }, [categoryFilter, locationCountry, locationState, locationCity, maxDistanceFilter, mustVisitFilter, openTodayFilter, wishListFilter]);

  const handleClearFilters = () => {
    setCategoryFilter([]);
    setLocationCountry(null);
    setLocationState(null);
    setLocationCity(null);
    setMaxDistanceFilter(null);
    setMustVisitFilter(false);
    setOpenTodayFilter(false);
    setWishListFilter(false);
  };

  const visitedIds = new Set(visits.map(v => v.museum_id));

  // Compute distances for all museums
  const museumsWithData = useMemo(() => {
    return museums.map(museum => {
      let distance: number | null = null;
      let distanceFormatted: string | null = null;
      
      if (latitude !== null && longitude !== null) {
        distance = calculateDistance(latitude, longitude, museum.lat, museum.lng);
        distanceFormatted = formatDistance(distance);
      }
      
      return { museum, distance, distanceFormatted };
    });
  }, [museums, latitude, longitude]);

  // Get available locations for LocationFilter
  const availableLocations = useMemo(() => {
    return museumsWithData.map(({ museum }) => ({
      country: museum.country,
      state: museum.state,
      city: museum.city,
    }));
  }, [museumsWithData]);

  // Count museums by category (respecting other filters)
  const categoryCounts = useMemo(() => {
    const baseFiltered = museumsWithData.filter(({ museum, distance }) => {
      const matchesSearch = museum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        museum.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = 
        (!locationCountry || museum.country === locationCountry) &&
        (!locationState || museum.state === locationState) &&
        (!locationCity || museum.city === locationCity);
      const matchesDistance = maxDistanceFilter === null || (distance !== null && distance <= maxDistanceFilter);
      const matchesMustVisit = !mustVisitFilter || museum.highlight;
      const matchesOpenToday = !openTodayFilter || isOpenToday(museum.opening_hours);
      const matchesWishList = !wishListFilter || isSaved(museum.museum_id);
      return matchesSearch && matchesLocation && matchesDistance && matchesMustVisit && matchesOpenToday && matchesWishList;
    });

    return {
      art: baseFiltered.filter(m => m.museum.tags === 'art').length,
      history: baseFiltered.filter(m => m.museum.tags === 'history').length,
      science: baseFiltered.filter(m => m.museum.tags === 'science').length,
      nature: baseFiltered.filter(m => m.museum.tags === 'nature').length,
      temple: baseFiltered.filter(m => m.museum.tags === 'temple').length,
    };
  }, [museumsWithData, searchQuery, locationCountry, locationState, locationCity, maxDistanceFilter, mustVisitFilter, openTodayFilter, wishListFilter, isSaved]);

  // Count Must-Visit museums (based on current filtered set minus mustVisit filter itself)
  const mustVisitCount = useMemo(() => {
    return museumsWithData.filter(({ museum, distance }) => {
      const matchesSearch = museum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        museum.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter.length === 0 || (museum.tags && categoryFilter.includes(museum.tags as MuseumCategory));
      const matchesLocation = 
        (!locationCountry || museum.country === locationCountry) &&
        (!locationState || museum.state === locationState) &&
        (!locationCity || museum.city === locationCity);
      const matchesDistance = maxDistanceFilter === null || (distance !== null && distance <= maxDistanceFilter);
      return matchesSearch && matchesCategory && matchesLocation && matchesDistance && museum.highlight;
    }).length;
  }, [museumsWithData, searchQuery, categoryFilter, locationCountry, locationState, locationCity, maxDistanceFilter]);

  // Filter museums
  const filteredMuseums = museumsWithData.filter(({ museum, distance }) => {
    const matchesSearch = museum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      museum.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter.length === 0 || (museum.tags && categoryFilter.includes(museum.tags as MuseumCategory));
    const matchesLocation = 
      (!locationCountry || museum.country === locationCountry) &&
      (!locationState || museum.state === locationState) &&
      (!locationCity || museum.city === locationCity);
    const matchesDistance = maxDistanceFilter === null || (distance !== null && distance <= maxDistanceFilter);
    const matchesMustVisit = !mustVisitFilter || museum.highlight;
    const matchesOpenToday = !openTodayFilter || isOpenToday(museum.opening_hours);
    const matchesWishList = !wishListFilter || isSaved(museum.museum_id);
    return matchesSearch && matchesCategory && matchesLocation && matchesDistance && matchesMustVisit && matchesOpenToday && matchesWishList;
  });

  // Sort by distance (nearest first), null distances go to end
  const sortedMuseums = useMemo(() => {
    return [...filteredMuseums].sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }, [filteredMuseums]);

  // Get data for selected museum
  const selectedMuseumData = useMemo(() => {
    if (!selectedMuseum) return null;
    return museumsWithData.find(m => m.museum.museum_id === selectedMuseum.museum_id) || null;
  }, [selectedMuseum, museumsWithData]);

  const handleMarkVisited = (museumId: string) => {
    if (visitedIds.has(museumId)) {
      removeVisit.mutate(museumId);
    } else {
      addVisit.mutate(museumId);
    }
  };

  const handleViewPlan = () => {
    if (selectedMuseum) {
      navigate(`/museum/${selectedMuseum.museum_id}`);
    }
  };

  const handleLocationChange = (country: string | null, state: string | null, city: string | null) => {
    setLocationCountry(country);
    setLocationState(state);
    setLocationCity(city);
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-73px)] flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-32 h-32 rounded-full mx-auto mb-4" />
          <Skeleton className="w-48 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-128px)] md:h-[calc(100vh-73px)] flex flex-col md:flex-row">
      {/* Desktop: Side Panel */}
      <div className="hidden md:flex md:w-96 lg:w-[420px] flex-col border-r border-border bg-background">
        {/* Search Row */}
        <div className="p-4 border-b border-border space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('map.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Row 1: Toggle chips */}
          <div className="flex flex-wrap items-center gap-2">
            <MustVisitFilter
              enabled={mustVisitFilter}
              onToggle={setMustVisitFilter}
              count={mustVisitCount}
            />
            <OpenTodayFilter
              enabled={openTodayFilter}
              onToggle={setOpenTodayFilter}
            />
            <WishListFilter
              enabled={wishListFilter}
              onToggle={setWishListFilter}
            />
          </div>

          {/* Row 2: Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-shrink-0">
              <LocationFilter
                availableLocations={availableLocations}
                selectedCountry={locationCountry}
                selectedState={locationState}
                selectedCity={locationCity}
                onSelectionChange={handleLocationChange}
              />
            </div>
            <div className="flex-shrink-0">
              <DistanceFilter
                maxDistance={maxDistanceFilter}
                onMaxDistanceChange={setMaxDistanceFilter}
                hasLocation={latitude !== null}
              />
            </div>
            <CategoryFilterDropdown 
              selected={categoryFilter} 
              onSelectionChange={setCategoryFilter}
              counts={categoryCounts}
            />
          </div>

          {/* Active Filters Row */}
          <ActiveFilters
            categories={categoryFilter}
            locationCountry={locationCountry}
            locationState={locationState}
            locationCity={locationCity}
            maxDistance={maxDistanceFilter}
            mustVisit={mustVisitFilter}
            openToday={openTodayFilter}
            wishList={wishListFilter}
            onRemoveCategory={(cat) => setCategoryFilter(categoryFilter.filter(c => c !== cat))}
            onClearLocation={() => handleLocationChange(null, null, null)}
            onClearDistance={() => setMaxDistanceFilter(null)}
            onClearMustVisit={() => setMustVisitFilter(false)}
            onClearOpenToday={() => setOpenTodayFilter(false)}
            onClearWishList={() => setWishListFilter(false)}
            onClearAll={handleClearFilters}
          />

          <p className="text-xs text-muted-foreground">
            {sortedMuseums.length} {t('map.museums')} • {visitedIds.size} {t('map.visited')}
            {latitude !== null && <span> • {t('map.sortedByDistance')}</span>}
            {openTodayFilter && <span> • Showing museums open today</span>}
            {wishListFilter && <span> • Showing wish list museums</span>}
          </p>
        </div>

        {/* Museum List or Selected Detail */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {selectedMuseum && selectedMuseumData ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedMuseum(null)}
                  className="text-sm text-primary hover:underline"
                >
                  {t('map.backToList')}
                </button>
                <MuseumCard
                  museum={selectedMuseum}
                  isVisited={visitedIds.has(selectedMuseum.museum_id)}
                  onMarkVisited={() => handleMarkVisited(selectedMuseum.museum_id)}
                  onViewPlan={selectedMuseum.has_full_content ? handleViewPlan : undefined}
                  stateCode={selectedMuseum.state}
                  distance={selectedMuseumData.distanceFormatted}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMuseums.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t('map.noResults')}</p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="text-sm text-primary hover:underline"
                      >
                        {t('common.clear')} filters
                      </button>
                    )}
                  </div>
                ) : (
                  sortedMuseums.map(({ museum, distanceFormatted }) => (
                    <div 
                      key={museum.museum_id}
                      onClick={() => setSelectedMuseum(museum)}
                    >
                      <MuseumCard 
                        museum={museum} 
                        compact 
                        stateCode={museum.state}
                        distance={distanceFormatted}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MuseumMap
          museums={sortedMuseums.map(m => m.museum)}
          selectedMuseum={selectedMuseum}
          onSelectMuseum={setSelectedMuseum}
          userLocation={latitude !== null && longitude !== null ? { latitude, longitude, accuracy } : null}
          locationFilter={{ country: locationCountry, state: locationState, city: locationCity }}
          className="w-full h-full"
        />

        {/* Mobile: Quick info overlay when museum selected */}
        {selectedMuseum && (
          <div className="md:hidden absolute top-4 left-4 right-4">
            <div className="gallery-card">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-semibold truncate">
                    {selectedMuseum.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMuseum.city}
                  </p>
                </div>
                {selectedMuseum.has_full_content && (
                  <span className="museum-chip">Guide</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Bottom Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedMuseum}
        onClose={() => setSelectedMuseum(null)}
        title={selectedMuseum?.name}
      >
        {selectedMuseum && selectedMuseumData && (
          <MuseumCard
            museum={selectedMuseum}
            isVisited={visitedIds.has(selectedMuseum.museum_id)}
            onMarkVisited={() => handleMarkVisited(selectedMuseum.museum_id)}
            onViewPlan={selectedMuseum.has_full_content ? handleViewPlan : undefined}
            stateCode={selectedMuseum.state}
            distance={selectedMuseumData.distanceFormatted}
          />
        )}
      </MobileBottomSheet>
    </div>
  );
}
