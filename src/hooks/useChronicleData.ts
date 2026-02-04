import { useMemo } from 'react';
import { useEnrichedArtworks, useArtists } from '@/hooks/useArtworks';
import { getPrimaryYear, getTimeBuckets, Granularity } from '@/lib/parseArtworkYear';
import { parseMovements } from '@/lib/normalizeMovement';
import type { EnrichedArtwork, Artist } from '@/types/art';

export interface ArtworkWithMetadata extends EnrichedArtwork {
  year_parsed: number | null;
  movements: string[];
}

export interface MovementCount {
  movement: string;
  count: number;
}

export interface TimeBucket {
  start: number;
  end: number;
  label: string;
  artworks: ArtworkWithMetadata[];
  totalCount: number;
  topMovements: MovementCount[];
}

export function useChronicleData() {
  const { data: artworks, artists, museums, isLoading } = useEnrichedArtworks();
  const { data: allArtists } = useArtists();

  // Create artist movement lookup
  const artistMovements = useMemo(() => {
    const lookup = new Map<string, string[]>();
    for (const artist of (allArtists || [])) {
      lookup.set(artist.artist_id, parseMovements(artist.movement));
    }
    return lookup;
  }, [allArtists]);

  // Enrich artworks with parsed years and movements
  const enrichedArtworks = useMemo((): ArtworkWithMetadata[] => {
    return artworks.map(artwork => ({
      ...artwork,
      year_parsed: getPrimaryYear(artwork.year),
      movements: artistMovements.get(artwork.artist_id) || [],
    }));
  }, [artworks, artistMovements]);

  // Filter artworks with valid years
  const artworksWithYears = useMemo(() => {
    return enrichedArtworks.filter(a => a.year_parsed !== null);
  }, [enrichedArtworks]);

  // Calculate year range
  const yearRange = useMemo(() => {
    if (artworksWithYears.length === 0) {
      return { min: 1400, max: 2000 };
    }
    const years = artworksWithYears.map(a => a.year_parsed!);
    return {
      min: Math.min(...years),
      max: Math.max(...years),
    };
  }, [artworksWithYears]);

  // Get all unique movements with counts
  const allMovements = useMemo((): MovementCount[] => {
    const counts = new Map<string, number>();
    
    for (const artwork of enrichedArtworks) {
      for (const movement of artwork.movements) {
        counts.set(movement, (counts.get(movement) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([movement, count]) => ({ movement, count }))
      .sort((a, b) => b.count - a.count);
  }, [enrichedArtworks]);

  return {
    artworks: enrichedArtworks,
    artworksWithYears,
    yearRange,
    allMovements,
    isLoading,
    museums,
    artists: allArtists || [],
  };
}

export function useFilteredTimeBuckets(
  artworks: ArtworkWithMetadata[],
  granularity: Granularity,
  yearFilter: [number, number] | null,
  selectedMovements: Set<string>
) {
  return useMemo(() => {
    // Filter artworks by year range
    let filtered = artworks.filter(a => a.year_parsed !== null);
    
    if (yearFilter) {
      filtered = filtered.filter(a => 
        a.year_parsed! >= yearFilter[0] && a.year_parsed! <= yearFilter[1]
      );
    }

    // Filter by movements if any selected
    if (selectedMovements.size > 0) {
      filtered = filtered.filter(a => 
        a.movements.some(m => selectedMovements.has(m))
      );
    }

    // Get year range from filtered artworks
    if (filtered.length === 0) {
      return [];
    }

    const years = filtered.map(a => a.year_parsed!);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // Create buckets
    const bucketDefs = getTimeBuckets(minYear, maxYear, granularity);
    
    const buckets: TimeBucket[] = bucketDefs.map(def => {
      const bucketArtworks = filtered.filter(
        a => a.year_parsed! >= def.start && a.year_parsed! <= def.end
      );

      // Count movements in this bucket
      const movementCounts = new Map<string, number>();
      for (const artwork of bucketArtworks) {
        for (const movement of artwork.movements) {
          movementCounts.set(movement, (movementCounts.get(movement) || 0) + 1);
        }
      }

      const topMovements = Array.from(movementCounts.entries())
        .map(([movement, count]) => ({ movement, count }))
        .sort((a, b) => b.count - a.count);

      return {
        ...def,
        artworks: bucketArtworks,
        totalCount: bucketArtworks.length,
        topMovements,
      };
    }).filter(b => b.totalCount > 0);

    return buckets;
  }, [artworks, granularity, yearFilter, selectedMovements]);
}
