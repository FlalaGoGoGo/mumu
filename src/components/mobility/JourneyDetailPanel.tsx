import type { EnrichedArtwork } from '@/types/art';
import type { ArtworkMovement, MobilityResearchStatus } from '@/types/movement';
import { Badge } from '@/components/ui/badge';
import { getArtworkImageUrl } from '@/types/art';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  artwork: EnrichedArtwork;
  movements: ArtworkMovement[];
  museumMap: Map<string, MuseumPoint>;
  mobilityStatus: MobilityResearchStatus;
  mobilityNote: string;
}

const statusLabels: Record<MobilityResearchStatus, string> = {
  HAS_MOVEMENT_EVENTS: 'Has Movement Data',
  NO_CONFIRMED_MOVEMENT: 'No Confirmed Movement',
  AMBIGUOUS_SOURCE_NEEDS_REVIEW: 'Needs Review',
  NOT_RESEARCHED: 'Not Researched',
};

const statusColors: Record<MobilityResearchStatus, string> = {
  HAS_MOVEMENT_EVENTS: 'bg-green-100 text-green-700',
  NO_CONFIRMED_MOVEMENT: 'bg-muted text-muted-foreground',
  AMBIGUOUS_SOURCE_NEEDS_REVIEW: 'bg-amber-100 text-amber-700',
  NOT_RESEARCHED: 'bg-muted text-muted-foreground',
};

export function JourneyDetailPanel({ artwork, movements, museumMap, mobilityStatus, mobilityNote }: Props) {
  const homeMuseum = museumMap.get(artwork.museum_id);
  const imageUrl = getArtworkImageUrl(artwork);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Artwork image */}
      {imageUrl && (
        <div className="aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={imageUrl}
            alt={artwork.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight">{artwork.title}</h3>
          <p className="text-sm text-muted-foreground">{artwork.artist_name}</p>
          {artwork.year && <p className="text-xs text-muted-foreground">{artwork.year}</p>}
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Home Museum</p>
            <p className="font-medium">{homeMuseum?.name || artwork.museum_name}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Research Status</p>
            <Badge variant="secondary" className={statusColors[mobilityStatus]}>
              {statusLabels[mobilityStatus]}
            </Badge>
          </div>

          {mobilityNote && (
            <div>
              <p className="text-xs text-muted-foreground">Research Note</p>
              <p className="text-xs leading-relaxed">{mobilityNote}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground">Movement Events</p>
            <p className="font-medium">{movements.length}</p>
          </div>
        </div>

        {/* Exhibition list */}
        {movements.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Exhibitions & Loans</p>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {movements.map(m => (
                <div key={m.movement_id} className="text-xs space-y-0.5">
                  <p className="font-medium">{m.related_exhibition_name || m.movement_type}</p>
                  <p className="text-muted-foreground">{m.start_date} – {m.end_date}</p>
                  {m.source_url && (
                    <a
                      href={m.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {m.source_title || 'Source'}
                    </a>
                  )}
                  <p className="text-[10px] text-muted-foreground">Confidence: {m.confidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
