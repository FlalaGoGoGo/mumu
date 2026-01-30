import { useState, useMemo } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { useExhibitions } from '@/hooks/useExhibitions';
import { ExhibitionCard } from '@/components/exhibition/ExhibitionCard';
import { ExhibitionFilters } from '@/components/exhibition/ExhibitionFilters';
import { Button } from '@/components/ui/button';
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

export default function ExhibitionsPage() {
  const { data: exhibitions, isLoading, error } = useExhibitions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuseum, setSelectedMuseum] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Extract unique museums
  const museums = useMemo(() => {
    if (!exhibitions) return [];
    const uniqueMuseums = [...new Set(exhibitions.map((e) => e.museum_name))];
    return uniqueMuseums.sort();
  }, [exhibitions]);

  // Filter and sort exhibitions
  const filteredExhibitions = useMemo(() => {
    if (!exhibitions) return [];

    let filtered = exhibitions;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.exhibition_name.toLowerCase().includes(query) ||
          e.museum_name.toLowerCase().includes(query)
      );
    }

    // Museum filter
    if (selectedMuseum !== 'all') {
      filtered = filtered.filter((e) => e.museum_name === selectedMuseum);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((e) => e.status === selectedStatus);
    }

    return sortExhibitions(filtered);
  }, [exhibitions, searchQuery, selectedMuseum, selectedStatus]);

  const hasActiveFilters = searchQuery !== '' || selectedMuseum !== 'all' || selectedStatus !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedMuseum('all');
    setSelectedStatus('all');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
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
        museums={museums}
        selectedMuseum={selectedMuseum}
        onMuseumChange={setSelectedMuseum}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExhibitions.map((exhibition) => (
            <ExhibitionCard key={exhibition.exhibition_id} exhibition={exhibition} />
          ))}
        </div>
      )}
    </div>
  );
}
