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
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CategoryFilter, type MuseumCategory } from '@/components/map/CategoryFilter';
import { StateFilter } from '@/components/map/StateFilter';
import { DistanceFilter } from '@/components/map/DistanceFilter';
import { MustVisitFilter } from '@/components/map/MustVisitFilter';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { calculateDistance, formatDistance } from '@/lib/distance';
import { useLanguage } from '@/lib/i18n';
import type { Museum } from '@/types/museum';

export default function MapPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: museums = [], isLoading } = useMuseums();
  const { data: visits = [] } = useVisits();
  const addVisit = useAddVisit();
  const removeVisit = useRemoveVisit();
  const { latitude, longitude, accuracy } = useGeolocation(true);
  
  const [selectedMuseum, setSelectedMuseum] = useState<Museum | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MuseumCategory>('all');
  const [stateFilter, setStateFilter] = useState<string[]>([]);
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number | null>(null);
  const [mustVisitFilter, setMustVisitFilter] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== 'all') count++;
    if (stateFilter.length > 0) count++;
    if (maxDistanceFilter !== null) count++;
    if (mustVisitFilter) count++;
    return count;
  }, [categoryFilter, stateFilter, maxDistanceFilter, mustVisitFilter]);

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setStateFilter([]);
    setMaxDistanceFilter(null);
    setMustVisitFilter(false);
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

  // Count museums by category
  const categoryCounts = useMemo(() => {
    return {
      all: museumsWithData.length,
      art: museumsWithData.filter(m => m.museum.tags === 'art').length,
      history: museumsWithData.filter(m => m.museum.tags === 'history').length,
      science: museumsWithData.filter(m => m.museum.tags === 'science').length,
      nature: museumsWithData.filter(m => m.museum.tags === 'nature').length,
      temple: museumsWithData.filter(m => m.museum.tags === 'temple').length,
    };
  }, [museumsWithData]);

  // Count Must-Visit museums (based on current filtered set minus mustVisit filter itself)
  const mustVisitCount = useMemo(() => {
    return museumsWithData.filter(({ museum, distance }) => {
      const matchesSearch = museum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        museum.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || museum.tags === categoryFilter;
      const matchesState = stateFilter.length === 0 || (museum.state && stateFilter.includes(museum.state));
      const matchesDistance = maxDistanceFilter === null || (distance !== null && distance <= maxDistanceFilter);
      return matchesSearch && matchesCategory && matchesState && matchesDistance && museum.highlight;
    }).length;
  }, [museumsWithData, searchQuery, categoryFilter, stateFilter, maxDistanceFilter]);

  // Get unique states sorted alphabetically
  const availableStates = useMemo(() => {
    const states = museumsWithData
      .map(m => m.museum.state)
      .filter((state): state is string => !!state);
    return [...new Set(states)].sort();
  }, [museumsWithData]);

  // Filter by search query, category, state, distance, and must-visit
  const filteredMuseums = museumsWithData.filter(({ museum, distance }) => {
    const matchesSearch = museum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      museum.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || museum.tags === categoryFilter;
    const matchesState = stateFilter.length === 0 || (museum.state && stateFilter.includes(museum.state));
    const matchesDistance = maxDistanceFilter === null || (distance !== null && distance <= maxDistanceFilter);
    const matchesMustVisit = !mustVisitFilter || museum.highlight;
    return matchesSearch && matchesCategory && matchesState && matchesDistance && matchesMustVisit;
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
    navigate('/plan');
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
        {/* Search Row with Filters Button */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
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
            <Button
              variant={filtersOpen ? "secondary" : "outline"}
              size="default"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{t('map.filters')}</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Collapsible Filter Panel */}
          <Collapsible open={filtersOpen}>
            <CollapsibleContent className="space-y-3 pt-3 border-t border-border">
              {/* Category Chips */}
              <CategoryFilter 
                selected={categoryFilter} 
                onSelect={setCategoryFilter}
                counts={categoryCounts}
              />
              
              {/* State, Distance & Must-Visit Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <StateFilter
                  availableStates={availableStates}
                  selectedStates={stateFilter}
                  onSelectionChange={setStateFilter}
                />
                <DistanceFilter
                  maxDistance={maxDistanceFilter}
                  onMaxDistanceChange={setMaxDistanceFilter}
                  hasLocation={latitude !== null}
                />
                <MustVisitFilter
                  enabled={mustVisitFilter}
                  onToggle={setMustVisitFilter}
                  count={mustVisitCount}
                />
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground ml-auto"
                  >
                    {t('common.clear')}
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <p className="text-xs text-muted-foreground">
            {sortedMuseums.length} {t('map.museums')} • {visitedIds.size} {t('map.visited')}
            {latitude !== null && <span> • {t('map.sortedByDistance')}</span>}
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
                {sortedMuseums.map(({ museum, distanceFormatted }) => (
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
                ))}
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
