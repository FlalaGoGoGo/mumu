import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChronicleData, useFilteredTimeBuckets, type ArtworkWithMetadata } from '@/hooks/useChronicleData';
import { type Granularity } from '@/lib/parseArtworkYear';
import { TimelineBucket } from '@/components/chronicle/TimelineBucket';
import { MovementBookmarks } from '@/components/chronicle/MovementBookmarks';
import { GalleryDrawer } from '@/components/chronicle/GalleryDrawer';
import { cn } from '@/lib/utils';

export default function ArtChroniclePage() {
  const navigate = useNavigate();
  const { artworks, artworksWithYears, yearRange, allMovements, isLoading } = useChronicleData();
  
  // Filters
  const [granularity, setGranularity] = useState<Granularity>('century');
  const [yearFilter, setYearFilter] = useState<[number, number] | null>(null);
  const [selectedMovements, setSelectedMovements] = useState<Set<string>>(new Set());
  const [selectedBucket, setSelectedBucket] = useState<{ start: number; end: number } | null>(null);

  // Effective year range (user-selected or full range)
  const effectiveYearRange = yearFilter || [yearRange.min, yearRange.max];

  // Get buckets based on filters
  const buckets = useFilteredTimeBuckets(
    artworksWithYears,
    granularity,
    yearFilter,
    selectedMovements
  );

  // Get filtered artworks for gallery
  const galleryArtworks = useMemo(() => {
    let filtered = artworksWithYears;

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter(a => 
        a.year_parsed! >= yearFilter[0] && a.year_parsed! <= yearFilter[1]
      );
    }

    // Apply movement filter
    if (selectedMovements.size > 0) {
      filtered = filtered.filter(a => 
        a.movements.some(m => selectedMovements.has(m))
      );
    }

    // Apply bucket filter
    if (selectedBucket) {
      filtered = filtered.filter(a =>
        a.year_parsed! >= selectedBucket.start && a.year_parsed! <= selectedBucket.end
      );
    }

    return filtered;
  }, [artworksWithYears, yearFilter, selectedMovements, selectedBucket]);

  // Calculate movement counts for current year range (for bookmark re-ranking)
  const rangeMovementCounts = useMemo(() => {
    const counts = new Map<string, number>();
    let filtered = artworksWithYears;

    if (yearFilter) {
      filtered = filtered.filter(a => 
        a.year_parsed! >= yearFilter[0] && a.year_parsed! <= yearFilter[1]
      );
    }

    for (const artwork of filtered) {
      for (const movement of artwork.movements) {
        counts.set(movement, (counts.get(movement) || 0) + 1);
      }
    }

    return counts;
  }, [artworksWithYears, yearFilter]);

  const handleReset = () => {
    setYearFilter(null);
    setSelectedMovements(new Set());
    setSelectedBucket(null);
    setGranularity('century');
  };

  const handleMovementToggle = (movement: string) => {
    setSelectedMovements(prev => {
      const next = new Set(prev);
      if (next.has(movement)) {
        next.delete(movement);
      } else {
        next.add(movement);
      }
      return next;
    });
  };

  const handleBucketClick = (bucket: { start: number; end: number }) => {
    if (selectedBucket?.start === bucket.start && selectedBucket?.end === bucket.end) {
      setSelectedBucket(null);
    } else {
      setSelectedBucket(bucket);
    }
  };

  // Build filter summary
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedBucket) {
      parts.push(`${selectedBucket.start}–${selectedBucket.end}`);
    } else if (yearFilter) {
      parts.push(`${yearFilter[0]}–${yearFilter[1]}`);
    }
    if (selectedMovements.size > 0) {
      parts.push(Array.from(selectedMovements).join(', '));
    }
    parts.push(`${galleryArtworks.length} artworks`);
    return `Gallery · ${parts.join(' · ')}`;
  }, [selectedBucket, yearFilter, selectedMovements, galleryArtworks.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--chronicle-bg))] flex items-center justify-center">
        <div className="animate-pulse text-primary-foreground/60">Loading chronicle...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--chronicle-bg))] relative overflow-hidden">
      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--chronicle-bg-deep))_100%)] opacity-60" />
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/art')}
          className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Art
        </Button>
      </div>

      {/* Main scroll container */}
      <div className="relative z-10 flex justify-center py-16 px-4 md:px-8">
        <div className="w-full max-w-5xl animate-[scaleY_0.6s_ease-out,fadeIn_0.4s_ease-out] origin-top">
          {/* Parchment scroll */}
          <div className={cn(
            "relative rounded-lg overflow-hidden",
            // Parchment background
            "bg-gradient-to-b from-[hsl(var(--parchment))] via-[hsl(var(--parchment))] to-[hsl(var(--parchment-dark))]",
            // Gold border
            "border-2 border-[hsl(var(--gold-border))]",
            // Shadow and depth
            "shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.2)]"
          )}>
            {/* Rolled top edge */}
            <div className="h-6 bg-gradient-to-b from-[hsl(var(--parchment-edge))] to-transparent shadow-[inset_0_-4px_8px_rgba(0,0,0,0.08)] rounded-t-lg" />

            {/* Scroll content */}
            <div className="px-6 py-6 md:px-10 md:py-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-[hsl(var(--ink))] tracking-wide">
                  Art Chronicle
                </h1>
                <p className="mt-2 text-[hsl(var(--ink-muted))] font-body text-sm">
                  Explore {artworksWithYears.length} artworks across time and artistic movements
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-[hsl(var(--parchment-edge))]">
                {/* Year Range Slider */}
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-medium text-[hsl(var(--ink-muted))] uppercase tracking-wider mb-2 block">
                    Year Range
                  </label>
                  <div className="px-2">
                    <Slider
                      min={yearRange.min}
                      max={yearRange.max}
                      step={10}
                      value={[effectiveYearRange[0], effectiveYearRange[1]]}
                      onValueChange={(values) => setYearFilter([values[0], values[1]])}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-[hsl(var(--ink-muted))]">
                    <span>{effectiveYearRange[0]}</span>
                    <span>{effectiveYearRange[1]}</span>
                  </div>
                </div>

                {/* Granularity Toggle */}
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--ink-muted))] uppercase tracking-wider mb-2 block">
                    Granularity
                  </label>
                  <ToggleGroup
                    type="single"
                    value={granularity}
                    onValueChange={(val) => val && setGranularity(val as Granularity)}
                    className="bg-[hsl(var(--parchment-dark))] rounded-md p-1"
                  >
                    <ToggleGroupItem value="century" className="text-xs px-3">
                      Century
                    </ToggleGroupItem>
                    <ToggleGroupItem value="50y" className="text-xs px-3">
                      50y
                    </ToggleGroupItem>
                    <ToggleGroupItem value="20y" className="text-xs px-3">
                      20y
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Reset Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-[hsl(var(--parchment-edge))] text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>

              {/* Main content area */}
              <div className="flex gap-6">
                {/* Timeline buckets */}
                <div className="flex-1">
                  <ScrollArea className="h-[50vh] pr-4">
                    <div className="space-y-4">
                      {buckets.length === 0 ? (
                        <div className="text-center py-12 text-[hsl(var(--ink-muted))]">
                          No artworks match your current filters
                        </div>
                      ) : (
                        buckets.map((bucket) => (
                          <TimelineBucket
                            key={bucket.label}
                            bucket={bucket}
                            isSelected={selectedBucket?.start === bucket.start}
                            selectedMovements={selectedMovements}
                            onBucketClick={() => handleBucketClick(bucket)}
                            onMovementClick={handleMovementToggle}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Movement bookmarks (desktop only) */}
                <div className="hidden md:block w-48 shrink-0">
                  <MovementBookmarks
                    movements={allMovements}
                    rangeMovementCounts={rangeMovementCounts}
                    selectedMovements={selectedMovements}
                    onMovementToggle={handleMovementToggle}
                  />
                </div>
              </div>

              {/* Chapter divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--parchment-edge))] to-transparent" />
                <span className="text-[hsl(var(--gold-border))] text-lg">✦</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--parchment-edge))] to-transparent" />
              </div>

              {/* Gallery Drawer */}
              <GalleryDrawer
                artworks={galleryArtworks}
                filterSummary={filterSummary}
              />
            </div>

            {/* Rolled bottom edge */}
            <div className="h-6 bg-gradient-to-t from-[hsl(var(--parchment-edge))] to-transparent shadow-[inset_0_4px_8px_rgba(0,0,0,0.08)] rounded-b-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
