import { useState, useMemo } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { addDays } from 'date-fns';
import { useExhibitions } from '@/hooks/useExhibitions';
import { useMuseums } from '@/hooks/useMuseums';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { ExhibitionCard } from '@/components/exhibition/ExhibitionCard';
import { ExhibitionDetailModal } from '@/components/exhibition/ExhibitionDetailModal';
import { ExhibitionFilters, DateSortOrder, DistanceSortOrder } from '@/components/exhibition/ExhibitionFilters';
import { Button } from '@/components/ui/button';
import { calculateDistance, formatDistance } from '@/lib/distance';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';
import type { ExhibitionLocation } from '@/components/exhibition/ExhibitionLocationFilter';

const USER_VISIBLE_STATUSES: ExhibitionStatus[] = ['Ongoing', 'Upcoming', 'Past'];

// Sort priority: Ongoing -> Upcoming -> TBD -> Past
const STATUS_PRIORITY: Record<ExhibitionStatus, number> = {
  Ongoing: 0,
  Upcoming: 1,
  TBD: 2,
  Past: 3,
};

const MAX_DISTANCE_VALUE = 500;

export default function ExhibitionsPage() {
  const { data: exhibitions, isLoading: exhibitionsLoading, error: exhibitionsError } = useExhibitions();
  const { data: museums, isLoading: museumsLoading } = useMuseums();
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const { preferences } = usePreferences();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedStateProvince, setSelectedStateProvince] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<ExhibitionStatus[]>(['Ongoing', 'Upcoming']);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [maxDistance, setMaxDistance] = useState(MAX_DISTANCE_VALUE);
  const [closingSoon, setClosingSoon] = useState(false);
  const [dateSortOrder, setDateSortOrder] = useState<DateSortOrder>('none');
  const [distanceSortOrder, setDistanceSortOrder] = useState<DistanceSortOrder>('none');
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const hasGeoLocation = latitude !== null && longitude !== null;
  const hasHomeBase = !!(preferences.location_country && preferences.location_city);

  // Use GPS location first, fall back to Home Base
  const effectiveLat = latitude ?? (hasHomeBase ? null : null); // Home Base doesn't have coords, so we only use GPS
  const effectiveLng = longitude ?? null;
  const hasLocation = effectiveLat !== null && effectiveLng !== null;

  // Create museum lookup map
  const museumMap = useMemo(() => {
    if (!museums) return new Map();
    return new Map(museums.map(m => [m.museum_id, m]));
  }, [museums]);

  // Build available locations from exhibitions + museums (for the cascading filter)
  const availableLocations = useMemo((): ExhibitionLocation[] => {
    if (!exhibitions) return [];
    const locationSet = new Map<string, ExhibitionLocation>();

    exhibitions.forEach(exhibition => {
      const museum = museumMap.get(exhibition.museum_id);
      const country = museum?.country || 'Unknown';
      const state = museum?.state || exhibition.state || null;
      const city = exhibition.city || museum?.city || 'Unknown';
      const key = `${country}|${state}|${city}`;

      if (!locationSet.has(key)) {
        locationSet.set(key, { country, state, city });
      }
    });

    return Array.from(locationSet.values());
  }, [exhibitions, museumMap]);

  // Calculate distances for each exhibition
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

  // Filter and sort exhibitions
  const filteredExhibitions = useMemo(() => {
    if (!exhibitionsWithDistance.length) return [];

    let filtered = exhibitionsWithDistance;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        ({ exhibition }) =>
          exhibition.exhibition_name.toLowerCase().includes(query) ||
          exhibition.museum_name.toLowerCase().includes(query)
      );
    }

    // Location filter (Region → State/Province → City)
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

    // Status filter (multi-select)
    if (selectedStatuses.length > 0 && selectedStatuses.length < USER_VISIBLE_STATUSES.length) {
      filtered = filtered.filter(({ exhibition }) => selectedStatuses.includes(exhibition.status));
    }

    // Date range filter
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

    // Closing Soon filter
    if (closingSoon) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const closingSoonCutoff = addDays(today, 14);

      filtered = filtered.filter(({ exhibition }) => {
        if (!exhibition.end_date) return false;
        return exhibition.end_date >= today && exhibition.end_date <= closingSoonCutoff;
      });
    }

    // Distance filter
    if (hasLocation && maxDistance < MAX_DISTANCE_VALUE) {
      filtered = filtered.filter(({ distance }) => {
        return distance !== null && distance <= maxDistance;
      });
    }

    // Sorting
    const sortedFiltered = [...filtered].sort((a, b) => {
      // Distance sort (primary)
      if (distanceSortOrder !== 'none' && hasLocation) {
        const distA = a.distance ?? Number.MAX_SAFE_INTEGER;
        const distB = b.distance ?? Number.MAX_SAFE_INTEGER;
        const distDiff = distanceSortOrder === 'asc' ? distA - distB : distB - distA;
        if (distDiff !== 0) return distDiff;
      }

      // Date sort (secondary)
      if (dateSortOrder !== 'none') {
        const dateA = a.exhibition.start_date?.getTime();
        const dateB = b.exhibition.start_date?.getTime();

        if (dateA === undefined && dateB === undefined) {
          const hasDatesA = a.exhibition.start_date || a.exhibition.end_date;
          const hasDatesB = b.exhibition.start_date || b.exhibition.end_date;
          if (!hasDatesA && hasDatesB) return 1;
          if (hasDatesA && !hasDatesB) return -1;
          return 0;
        }
        if (dateA === undefined) return 1;
        if (dateB === undefined) return -1;

        const dateDiff = dateSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        if (dateDiff !== 0) return dateDiff;
      }

      // Default: status-based sorting
      const statusDiff = STATUS_PRIORITY[a.exhibition.status] - STATUS_PRIORITY[b.exhibition.status];
      if (statusDiff !== 0) return statusDiff;

      if (a.exhibition.status === 'Ongoing') {
        const aEnd = a.exhibition.end_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bEnd = b.exhibition.end_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aEnd - bEnd;
      }

      return 0;
    });

    return sortedFiltered;
  }, [exhibitionsWithDistance, searchQuery, selectedRegion, selectedStateProvince, selectedCity, selectedStatuses, dateFrom, dateTo, maxDistance, hasLocation, closingSoon, dateSortOrder, distanceSortOrder]);

  // Count active filters
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
    setSelectedStatuses(['Ongoing', 'Upcoming']);
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
        />
      </div>

      {/* Results */}
      {filteredExhibitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageOff className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">{t('exhibitions.noResults')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('exhibitions.noResultsHint')}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters}>
              {t('common.clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredExhibitions.map(({ exhibition, distanceFormatted }) => (
            <ExhibitionCard
              key={exhibition.exhibition_id}
              exhibition={exhibition}
              distance={distanceFormatted}
              onClick={() => {
                setSelectedExhibition(exhibition);
                setIsDetailOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <ExhibitionDetailModal
        exhibition={selectedExhibition}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedExhibition(null);
        }}
        museumWebsiteUrl={
          selectedExhibition
            ? museumMap.get(selectedExhibition.museum_id)?.website_url
            : null
        }
      />
    </div>
  );
}
