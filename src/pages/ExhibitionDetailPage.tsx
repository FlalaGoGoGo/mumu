import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin, ImageOff, Loader2 } from 'lucide-react';
import { useExhibition } from '@/hooks/useExhibitions';
import { RelatedArtworksGallery } from '@/components/exhibition/RelatedArtworksGallery';
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
  const [imageError, setImageError] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<EnrichedArtwork | null>(null);
  const [isArtworkOpen, setIsArtworkOpen] = useState(false);

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
      <div className="gallery-card p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-3 mb-4">
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

        {/* Date Label */}
        <p className="text-lg font-medium text-foreground mb-4">{exhibition.date_label}</p>

        {/* Museum & Location */}
        <div className="flex items-center gap-2 text-muted-foreground mb-6">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>
            {exhibition.museum_name} · {location}
          </span>
        </div>

        {/* Description */}
        {exhibition.short_description && (
          <div className="prose prose-stone max-w-none mb-6">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {exhibition.short_description}
            </p>
          </div>
        )}

        {/* Related Artworks */}
        {exhibition.related_artwork_ids.length > 0 && (
          <div className="gallery-card p-6 mt-6">
            <RelatedArtworksGallery
              artworkIds={exhibition.related_artwork_ids}
              onArtworkClick={handleArtworkClick}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
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
