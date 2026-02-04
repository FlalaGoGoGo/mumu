import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getArtworkImageUrl } from '@/types/art';
import type { ArtworkWithMetadata } from '@/hooks/useChronicleData';

interface GalleryDrawerProps {
  artworks: ArtworkWithMetadata[];
  filterSummary: string;
}

export function GalleryDrawer({ artworks, filterSummary }: GalleryDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show up to 10 thumbnails in collapsed state
  const previewArtworks = artworks.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-medium text-[hsl(var(--ink))]">
          {filterSummary}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Collapse
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Open Gallery
            </>
          )}
        </Button>
      </div>

      {/* Collapsed: Single row preview */}
      {!isExpanded && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2">
            {previewArtworks.map((artwork) => (
              <ArtworkThumbnail key={artwork.artwork_id} artwork={artwork} size="sm" />
            ))}
            {artworks.length > 10 && (
              <button
                onClick={() => setIsExpanded(true)}
                className="flex-shrink-0 w-16 h-16 rounded-sm bg-[hsl(var(--parchment-dark))] border border-[hsl(var(--parchment-edge))] flex items-center justify-center text-[hsl(var(--ink-muted))] text-xs hover:bg-[hsl(var(--parchment-edge)/0.5)] transition-colors"
              >
                +{artworks.length - 10}
              </button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Expanded: Full grid */}
      {isExpanded && (
        <ScrollArea className="h-[40vh]">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 pr-4">
            {artworks.map((artwork) => (
              <ArtworkThumbnail key={artwork.artwork_id} artwork={artwork} size="md" />
            ))}
          </div>
        </ScrollArea>
      )}

      {artworks.length === 0 && (
        <div className="text-center py-8 text-[hsl(var(--ink-muted))]">
          No artworks match your current filters
        </div>
      )}
    </div>
  );
}

interface ArtworkThumbnailProps {
  artwork: ArtworkWithMetadata;
  size: 'sm' | 'md';
}

function ArtworkThumbnail({ artwork, size }: ArtworkThumbnailProps) {
  const imageUrl = getArtworkImageUrl(artwork);
  const sizeClass = size === 'sm' ? 'w-16 h-16' : 'w-full aspect-square';

  return (
    <div
      className={cn(
        "group relative flex-shrink-0 rounded-sm overflow-hidden",
        "border-2 border-[hsl(var(--gold-border)/0.5)]",
        "hover:border-[hsl(var(--gold-border))] transition-colors",
        sizeClass
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-[hsl(var(--parchment-dark))] flex items-center justify-center">
          <span className="text-[hsl(var(--ink-muted))] text-xs">No image</span>
        </div>
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-[hsl(var(--ink)/0.8)] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
        <p className="text-[hsl(var(--parchment))] text-[10px] leading-tight font-medium line-clamp-2">
          {artwork.title}
        </p>
        <p className="text-[hsl(var(--parchment)/0.7)] text-[9px] leading-tight mt-0.5">
          {artwork.year}
        </p>
      </div>
    </div>
  );
}
