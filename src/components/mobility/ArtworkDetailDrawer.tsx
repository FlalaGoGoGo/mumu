import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, AlertCircle, HelpCircle } from 'lucide-react';
import { getArtworkImageUrl } from '@/types/art';
import type { EnrichedArtwork } from '@/types/art';
import type { ArtworkMovement, MobilityResearchStatus } from '@/types/movement';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artwork: EnrichedArtwork | null;
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

const statusIcons: Record<MobilityResearchStatus, React.ReactNode> = {
  HAS_MOVEMENT_EVENTS: <MapPin className="h-4 w-4 text-green-600" />,
  NO_CONFIRMED_MOVEMENT: <MapPin className="h-4 w-4 text-muted-foreground" />,
  AMBIGUOUS_SOURCE_NEEDS_REVIEW: <AlertCircle className="h-4 w-4 text-amber-600" />,
  NOT_RESEARCHED: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
};

export function ArtworkDetailDrawer({
  open,
  onOpenChange,
  artwork,
  movements,
  museumMap,
  mobilityStatus,
  mobilityNote,
}: Props) {
  if (!artwork) return null;

  const homeMuseum = museumMap.get(artwork.museum_id);
  const imageUrl = getArtworkImageUrl(artwork);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Image */}
        {imageUrl && (
          <div className="aspect-[16/10] bg-muted overflow-hidden">
            <img
              src={imageUrl}
              alt={artwork.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-6 space-y-6">
          <SheetHeader className="text-left space-y-1.5">
            <SheetTitle className="font-display text-xl leading-tight">
              {artwork.title}
            </SheetTitle>
            <SheetDescription className="text-sm">
              {artwork.artist_name}
              {artwork.year && <span className="ml-1.5 text-muted-foreground">· {artwork.year}</span>}
            </SheetDescription>
          </SheetHeader>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Home Museum</p>
              <p className="font-medium">{homeMuseum?.name || artwork.museum_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Movement Events</p>
              <p className="font-medium tabular-nums">{movements.length}</p>
            </div>
            <div className="col-span-2 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Research Status</p>
              <div className="flex items-center gap-2">
                {statusIcons[mobilityStatus]}
                <Badge variant="secondary" className={statusColors[mobilityStatus]}>
                  {statusLabels[mobilityStatus]}
                </Badge>
              </div>
            </div>
            {mobilityNote && (
              <div className="col-span-2 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Research Note</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{mobilityNote}</p>
              </div>
            )}
          </div>

          {/* Movement Timeline */}
          {movements.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Movement Timeline
              </h4>
              <div className="space-y-0 relative">
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />
                {movements.map((m, i) => {
                  const lender = museumMap.get(m.lender_museum_id);
                  const borrower = museumMap.get(m.borrower_museum_id);
                  return (
                    <div key={m.movement_id} className="flex gap-3 py-3 relative">
                      <div className="shrink-0 z-10">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border-2 border-background">
                          {i + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {lender?.name || m.lender_museum_id} → {borrower?.name || m.borrower_museum_id}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {m.start_date} – {m.end_date}
                        </p>
                        {m.related_exhibition_name && (
                          <p className="text-xs italic text-muted-foreground truncate">
                            {m.related_exhibition_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            m.confidence === 'HIGH' ? 'bg-green-100 text-green-700' :
                            m.confidence === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {m.confidence}
                          </span>
                          <span className="text-muted-foreground capitalize">{m.movement_type}</span>
                          {m.source_url && (
                            <a
                              href={m.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-primary hover:underline ml-auto"
                            >
                              Source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {movements.length === 0 && mobilityStatus !== 'HAS_MOVEMENT_EVENTS' && (
            <div className="rounded-lg border bg-muted/30 p-6 text-center space-y-2">
              {statusIcons[mobilityStatus]}
              <p className="text-sm text-muted-foreground">
                {mobilityStatus === 'NO_CONFIRMED_MOVEMENT'
                  ? 'This artwork appears to remain at its home museum.'
                  : mobilityStatus === 'AMBIGUOUS_SOURCE_NEEDS_REVIEW'
                  ? 'Ambiguous sources — mobility data needs review.'
                  : 'Mobility research has not started for this artwork yet.'}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
