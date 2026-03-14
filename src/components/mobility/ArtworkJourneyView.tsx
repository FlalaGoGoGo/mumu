import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { JourneyMap } from './JourneyMap';
import { JourneyTimeline } from './JourneyTimeline';
import { JourneyDetailPanel } from './JourneyDetailPanel';
import type { EnrichedArtwork } from '@/types/art';
import type { ArtworkMovement, MobilityResearchStatus } from '@/types/movement';
import { AlertCircle, MapPin, HelpCircle } from 'lucide-react';

interface Props {
  artwork: EnrichedArtwork | null;
  movements: ArtworkMovement[];
  museumMap: Map<string, { museum_id: string; name: string; lat: number; lng: number }>;
  mobilityStatus: MobilityResearchStatus;
  mobilityNote: string;
}

export function ArtworkJourneyView({ artwork, movements, museumMap, mobilityStatus, mobilityNote }: Props) {
  const isMobile = useIsMobile();

  if (!artwork) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Select an artwork to view its journey.
      </div>
    );
  }

  const homeMuseum = museumMap.get(artwork.museum_id);
  const showMap = mobilityStatus === 'HAS_MOVEMENT_EVENTS' && movements.length > 0;

  const emptyStateContent = () => {
    switch (mobilityStatus) {
      case 'NO_CONFIRMED_MOVEMENT':
        return (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <MapPin className="h-8 w-8" />
            <p className="font-medium">No confirmed movement found.</p>
            <p className="text-sm">This artwork appears to remain at its home museum.</p>
          </div>
        );
      case 'AMBIGUOUS_SOURCE_NEEDS_REVIEW':
        return (
          <div className="flex flex-col items-center gap-2 text-amber-600">
            <AlertCircle className="h-8 w-8" />
            <p className="font-medium">Ambiguous sources — needs review</p>
            <p className="text-sm text-muted-foreground max-w-md text-center">{mobilityNote}</p>
          </div>
        );
      case 'NOT_RESEARCHED':
        return (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <HelpCircle className="h-8 w-8" />
            <p className="font-medium">Mobility research has not started for this artwork yet.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={isMobile ? 'space-y-4' : 'flex gap-4'}>
      <div className="flex-1 space-y-4">
        {showMap ? (
          <>
            <div className="rounded-lg border overflow-hidden" style={{ height: isMobile ? 350 : 500 }}>
              <JourneyMap
                movements={movements}
                museumMap={museumMap}
                homeMuseum={homeMuseum || null}
              />
            </div>
            <JourneyTimeline movements={movements} museumMap={museumMap} />
          </>
        ) : (
          <div className="rounded-lg border bg-card p-8">
            {/* Show home museum on a simple map even without movements */}
            {homeMuseum && (
              <div className="rounded-lg border overflow-hidden mb-6" style={{ height: 250 }}>
                <JourneyMap
                  movements={[]}
                  museumMap={museumMap}
                  homeMuseum={homeMuseum}
                />
              </div>
            )}
            <div className="flex justify-center py-8">
              {emptyStateContent()}
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <div className={isMobile ? '' : 'w-80 shrink-0'}>
        <JourneyDetailPanel
          artwork={artwork}
          movements={movements}
          museumMap={museumMap}
          mobilityStatus={mobilityStatus}
          mobilityNote={mobilityNote}
        />
      </div>
    </div>
  );
}
