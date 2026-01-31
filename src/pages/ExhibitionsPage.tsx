import { useState, useMemo } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { addDays } from 'date-fns';
import { useExhibitions } from '@/hooks/useExhibitions';
import { useMuseums } from '@/hooks/useMuseums';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ExhibitionCard } from '@/components/exhibition/ExhibitionCard';
import { ExhibitionFilters } from '@/components/exhibition/ExhibitionFilters';
import { Button } from '@/components/ui/button';
import { calculateDistance, formatDistance } from '@/lib/distance';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';

// Sort priority: Ongoing -> Upcoming -> TBD -> Past
const STATUS_PRIORITY: Record<ExhibitionStatus, number> = {
  Ongoing: 0,
  Upcoming: 1,
  TBD: 2,
  Past: 3,
};

function sortExhibitions(exhibitions: Exhibition[]): Exhibition[] {
  return [...exhibitions].sort((a, b) => {
    // Primary sort by status
    const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Secondary sort within same status
    switch (a.status) {
      case 'Upcoming':
        // Sort by start_date ascending
        if (a.start_date && b.start_date) {
          return a.start_date.getTime() - b.start_date.getTime();
        }
        return 0;

      case 'Past':
        // Sort by end_date descending
        if (a.end_date && b.end_date) {
          return b.end_date.getTime() - a.end_date.getTime();
        }
        return 0;

      case 'Ongoing':
        // Sort by end_date ascending (missing end_date = far future)
        const aEnd = a.end_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bEnd = b.end_date?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aEnd - bEnd;

      default:
        return 0;
    }
  });
}

const MAX_DISTANCE_VALUE = 500;

export default function ExhibitionsPage() {
  const { data: exhibitions, isLoading: exhibitionsLoading, error: exhibitionsError } = useExhibitions();
  const { data: museums, isLoading: museumsLoading } = useMuseums();
  const { latitude, longitude, loading: geoLoading } = useGeolocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [maxDistance, setMaxDistance] = useState(MAX_DISTANCE_VALUE);
  const [closingSoon, setClosingSoon] = useState(false);

  const hasLocation = latitude !== null && longitude !== null;

  // Create museum lookup map
  const museumMap = useMemo(() => {
    if (!museums) return new Map();
    return new Map(museums.map(m => [m.museum_id, m]));
  }, [museums]);

  // Calculate distances for each exhibition
  const exhibitionsWithDistance = useMemo(() => {
    if (!exhibitions) return [];
    
    return exhibitions.map(exhibition => {
      const museum = museumMap.get(exhibition.museum_id);
      let distance: number | null = null;
      let distanceFormatted: string | null = null;

      if (hasLocation && museum) {
        distance = calculateDistance(latitude!, longitude!, museum.lat, museum.lng);
        distanceFormatted = formatDistance(distance);
      }

      return { exhibition, distance, distanceFormatted };
    });
  }, [exhibitions, museumMap, hasLocation, latitude, longitude]);

  // Extract unique states
  const states = useMemo(() => {
    if (!exhibitions) return [];
    const uniqueStates = [...new Set(exhibitions.map((e) => e.state).filter(Boolean))] as string[];
    return uniqueStates.sort();
  }, [exhibitions]);

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

    // State filter
    if (selectedState !== 'all') {
      filtered = filtered.filter(({ exhibition }) => exhibition.state === selectedState);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(({ exhibition }) => exhibition.status === selectedStatus);
    }

    // Date range filter - check if exhibition overlaps with selected range
    if (dateFrom || dateTo) {
      filtered = filtered.filter(({ exhibition }) => {
        const { start_date, end_date } = exhibition;

        // If exhibition has no dates, exclude from date filtering
        if (!start_date && !end_date) return false;

        // Check overlap with selected range
        const rangeStart = dateFrom?.getTime() ?? 0;
        const rangeEnd = dateTo?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const exhibitStart = start_date?.getTime() ?? 0;
        const exhibitEnd = end_date?.getTime() ?? Number.MAX_SAFE_INTEGER;

        // Exhibition overlaps if it starts before range ends AND ends after range starts
        return exhibitStart <= rangeEnd && exhibitEnd >= rangeStart;
      });
    }

    // Closing Soon filter - exhibitions ending within 14 days
    if (closingSoon) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const closingSoonCutoff = addDays(today, 14);
      
      filtered = filtered.filter(({ exhibition }) => {
        // Must have an end_date to be considered "closing soon"
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

    // Sort exhibitions
    const sortedExhibitions = sortExhibitions(filtered.map(f => f.exhibition));
    
    // Map back to include distance info
    const distanceMap = new Map(filtered.map(f => [f.exhibition.exhibition_id, f]));
    return sortedExhibitions.map(exhibition => distanceMap.get(exhibition.exhibition_id)!);
  }, [exhibitionsWithDistance, searchQuery, selectedState, selectedStatus, dateFrom, dateTo, maxDistance, hasLocation, closingSoon]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedState !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (hasLocation && maxDistance < MAX_DISTANCE_VALUE) count++;
    if (closingSoon) count++;
    return count;
  }, [selectedState, selectedStatus, dateFrom, dateTo, maxDistance, hasLocation, closingSoon]);

  const hasActiveFilters = searchQuery !== '' || activeFilterCount > 0;

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedStatus('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setMaxDistance(MAX_DISTANCE_VALUE);
    setClosingSoon(false);
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
        <h2 className="font-display text-xl font-semibold mb-2">Failed to load exhibitions</h2>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
          Exhibitions
        </h1>
        <p className="text-muted-foreground">
          Discover current and upcoming exhibitions at museums near you.
        </p>
      </div>

      {/* Filters */}
      <ExhibitionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        states={states}
        selectedState={selectedState}
        onStateChange={setSelectedState}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        maxDistance={maxDistance}
        onMaxDistanceChange={setMaxDistance}
        hasLocation={hasLocation}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        closingSoon={closingSoon}
        onClosingSoonChange={setClosingSoon}
      />

      {/* Results */}
      {filteredExhibitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageOff className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">No exhibitions found</h2>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters.
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear filters
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
