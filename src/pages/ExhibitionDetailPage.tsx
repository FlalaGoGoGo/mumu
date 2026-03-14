import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin, ImageOff, Loader2 } from 'lucide-react';
import { useExhibition } from '@/hooks/useExhibitions';
import { useArtworksRaw, useMuseumsForArt } from '@/hooks/useArtworks';
import { RelatedArtworksGallery } from '@/components/exhibition/RelatedArtworksGallery';
import { ExhibitionArtworksMap } from '@/components/exhibition/ExhibitionArtworksMap';
import { ExhibitionProvenanceStats } from '@/components/exhibition/ExhibitionProvenanceStats';
import { ExhibitionSourceMuseums, type SourceMuseumGroup } from '@/components/exhibition/ExhibitionSourceMuseums';
import { ExhibitionResearchBadge } from '@/components/exhibition/ExhibitionResearchBadge';
import { ArtworkDetailSheet } from '@/components/art/ArtworkDetailSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ExhibitionStatus } from '@/types/exhibition';
import type { EnrichedArtwork } from '@/types/art';

const statusColors: Record<ExhibitionStatus, string> = {
  Ongoing: 'bg-green-50 text-green-700 border-green-200',
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  Past: 'bg-muted text-muted-foreground border-border',
  TBD: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function ExhibitionDetailPage() {
  const { exhibition_id } = useParams<{ exhibition_id: string }>();
  const navigate = useNavigate();
  const { data: exhibition, isLoading, error } = useExhibition(exhibition_id || null);
  const { data: artworks } = useArtworksRaw();
  const { data: museums } = useMuseumsForArt();
  const [imageError, setImageError] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<EnrichedArtwork | null>(null);
  const [isArtworkOpen, setIsArtworkOpen] = useState(false);
  const [highlightedMuseumId, setHighlightedMuseumId] = useState<string | null>(null);

  // Compute provenance data
  const { sourceMuseumGroups, countryCount } = useMemo(() => {
    if (!exhibition || !artworks || !museums || exhibition.related_artwork_ids.length === 0) {
      return { sourceMuseumGroups: [] as SourceMuseumGroup[], countryCount: 0 };
    }

    const museumById = new Map(museums.map(m => [m.museum_id, m]));
    const groups = new Map<string, SourceMuseumGroup>();
    const countries = new Set<string>();

    for (const id of exhibition.related_artwork_ids) {
      const artwork = artworks.find(a => a.artwork_id === id);
      if (!artwork) continue;

      const museum = museumById.get(artwork.museum_id);
      if (!museum) continue;

      countries.add(museum.country);

      const existing = groups.get(artwork.museum_id);
      if (existing) {
        existing.artworkCount++;
        existing.artworkTitles.push(artwork.title);
      } else {
        groups.set(artwork.museum_id, {
          museum_id: artwork.museum_id,
          museum_name: museum.name,
          city: museum.city,
          country: museum.country,
          artworkCount: 1,
          artworkTitles: [artwork.title],
          isVenue: artwork.museum_id === exhibition.museum_id,
        });
      }
    }

    return {
      sourceMuseumGroups: Array.from(groups.values()),
      countryCount: countries.size,
    };
  }, [exhibition, artworks, museums]);

  const handleViewMuseum = () => {
    if (exhibition) {
      navigate(`/?museum=${exhibition.museum_id}`);
    }
  };

  const handleArtworkClick = useCallback((artwork: EnrichedArtwork) => {
    setSelectedArtwork(artwork);
    setIsArtworkOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !exhibition) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Link
          to="/exhibitions"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Exhibitions
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageOff className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">Exhibition not found</h2>
          <p className="text-muted-foreground">
            The exhibition you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const location = [exhibition.city, exhibition.state].filter(Boolean).join(', ');
  const hasRelatedArtworks = exhibition.related_artwork_ids.length > 0;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* Back Link */}
      <Link
        to="/exhibitions"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Exhibitions
      </Link>

      {/* Cover Image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] bg-muted overflow-hidden rounded-sm mb-6">
        {!imageError && exhibition.cover_image_url ? (
          <img
            src={exhibition.cover_image_url}
            alt={exhibition.exhibition_name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Exhibition Details */}
      <div className="gallery-card p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground flex-1">
              {exhibition.exhibition_name}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs px-2 py-1 ${statusColors[exhibition.status]}`}
            >
              {exhibition.status}
            </Badge>
          </div>
          <p className="text-lg font-medium text-foreground mb-2">{exhibition.date_label}</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{exhibition.museum_name} · {location}</span>
          </div>
        </div>

        {/* Research Demo Badge */}
        <ExhibitionResearchBadge exhibitionId={exhibition.exhibition_id} />

        {/* Provenance Stats */}
        {hasRelatedArtworks && sourceMuseumGroups.length > 0 && (
          <ExhibitionProvenanceStats
            artworkCount={exhibition.related_artwork_ids.length}
            museumCount={sourceMuseumGroups.filter(g => !g.isVenue).length}
            countryCount={countryCount}
          />
        )}

        {/* Description */}
        {exhibition.short_description && (
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-foreground tracking-wide uppercase">
              About
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {exhibition.short_description}
            </p>
          </div>
        )}

        {/* Source Museums */}
        {hasRelatedArtworks && sourceMuseumGroups.length > 0 && (
          <ExhibitionSourceMuseums
            groups={sourceMuseumGroups}
            onMuseumClick={setHighlightedMuseumId}
            highlightedMuseumId={highlightedMuseumId}
          />
        )}

        {/* Related Artworks Gallery */}
        {hasRelatedArtworks && (
          <div className="gallery-card p-5">
            <RelatedArtworksGallery
              artworkIds={exhibition.related_artwork_ids}
              onArtworkClick={handleArtworkClick}
            />
          </div>
        )}

        {/* Empty state for related artworks */}
        {!hasRelatedArtworks && (
          <div className="flex flex-col items-center justify-center py-8 text-center rounded-sm border border-border bg-card/40">
            <ImageOff className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No artworks listed yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Related artworks will appear here once they are linked to this exhibition.
            </p>
          </div>
        )}

        {/* Lending Museums Map */}
        {hasRelatedArtworks && (
          <div className="gallery-card p-5">
            <ExhibitionArtworksMap
              artworkIds={exhibition.related_artwork_ids}
              venueMuseumId={exhibition.museum_id}
              venueMuseumName={exhibition.museum_name}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild>
            <a
              href={exhibition.official_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Official Page
            </a>
          </Button>
          <Button variant="secondary" onClick={handleViewMuseum}>
            <MapPin className="w-4 h-4 mr-2" />
            View Museum on Map
          </Button>
        </div>
      </div>

      {/* Artwork Detail Sheet */}
      <ArtworkDetailSheet
        artwork={selectedArtwork}
        open={isArtworkOpen}
        onOpenChange={(open) => {
          setIsArtworkOpen(open);
          if (!open) setSelectedArtwork(null);
        }}
      />
    </div>
  );
}
