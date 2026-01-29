import { useMemo } from 'react';
import { useMuseums } from '@/hooks/useMuseums';
import { useVisits, useHighlightCompletions, useRemoveVisit } from '@/hooks/usePassport';
import { useAicHighlights } from '@/hooks/useHighlights';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Trash2, Image, Flag, Info } from 'lucide-react';
import { parseUSState } from '@/lib/parseUSState';
import { AchievementBadge } from '@/components/passport/AchievementBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PassportPage() {
  const { data: museums = [] } = useMuseums();
  const { data: visits = [], isLoading: visitsLoading } = useVisits();
  const { data: completions = [] } = useHighlightCompletions();
  const { data: highlights = [] } = useAicHighlights();
  const removeVisit = useRemoveVisit();

  const museumMap = new Map(museums.map(m => [m.museum_id, m]));
  const highlightMap = new Map(highlights.map(h => [h.artic_id, h]));

  const completedHighlights = completions
    .map(c => highlightMap.get(c.artic_id))
    .filter(Boolean);

  // Compute unique US states visited
  const { uniqueStates, hasUnparsableAddresses } = useMemo(() => {
    const states = new Set<string>();
    let unparsable = false;
    
    for (const visit of visits) {
      const museum = museumMap.get(visit.museum_id);
      if (!museum) continue;
      
      // Only try to parse US museums
      if (museum.country === 'United States' || museum.country === 'USA' || museum.country === 'US') {
        const stateCode = parseUSState(museum.address, museum.country);
        if (stateCode) {
          states.add(stateCode);
        } else {
          unparsable = true;
        }
      }
    }
    
    return { uniqueStates: states, hasUnparsableAddresses: unparsable };
  }, [visits, museumMap]);

  const statesCount = uniqueStates.size;

  if (visitsLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="w-48 h-8 mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-80px)] md:h-[calc(100vh-73px)]">
      <div className="container max-w-4xl py-6 md:py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            My Passport
          </h1>
          <p className="text-muted-foreground">
            Track your museum visits and artwork discoveries
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          <div className="gallery-card text-center">
            <div className="font-display text-2xl md:text-3xl font-bold text-primary mb-1">
              {visits.length}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">Museums Visited</div>
          </div>
          <div className="gallery-card text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="font-display text-2xl md:text-3xl font-bold text-secondary mb-1 flex items-center justify-center gap-1">
                      {statesCount}
                      {hasUnparsableAddresses && (
                        <Info className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Flag className="w-3 h-3" />
                      US States
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    {hasUnparsableAddresses 
                      ? "Some museums don't include state info in their address, so count may be undercounted."
                      : "Unique US states where you've visited museums."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="gallery-card text-center">
            <div className="font-display text-2xl md:text-3xl font-bold text-accent mb-1">
              {completions.length}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">Artworks Seen</div>
          </div>
        </div>

        {/* Achievements */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4">
            🏆 Achievements
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <AchievementBadge
              title="Road Tripper"
              description="Visit museums in 2 US states"
              icon="road-tripper"
              unlocked={statesCount >= 2}
            />
            <AchievementBadge
              title="Cross-State Explorer"
              description="Visit museums in 5 US states"
              icon="explorer"
              unlocked={statesCount >= 5}
            />
            <AchievementBadge
              title="Nationwide Collector"
              description="Visit museums in 10 US states"
              icon="collector"
              unlocked={statesCount >= 10}
            />
          </div>
        </section>

        {/* Museums Visited */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Museums Visited
          </h2>
          
          {visits.length === 0 ? (
            <div className="gallery-card text-center py-8">
              <div className="passport-stamp mx-auto mb-4">
                <span>Empty</span>
              </div>
              <p className="text-muted-foreground">
                No museums visited yet. Start exploring!
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visits.map((visit) => {
                const museum = museumMap.get(visit.museum_id);
                if (!museum) return null;
                
                return (
                  <div key={visit.id} className="gallery-card flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full border-2 border-primary/30 flex-shrink-0 overflow-hidden bg-background">
                      {museum.hero_image_url ? (
                        <img 
                          src={museum.hero_image_url} 
                          alt={museum.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold truncate">
                        {museum.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {museum.city}, {museum.country}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {new Date(visit.visited_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeVisit.mutate(museum.museum_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Highlights */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-accent" />
            Artworks Discovered
          </h2>
          
          {completedHighlights.length === 0 ? (
            <div className="gallery-card text-center py-8">
              <div className="passport-stamp mx-auto mb-4">
                <span>Empty</span>
              </div>
              <p className="text-muted-foreground">
                No artworks marked yet. Visit the Plan page to start!
              </p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {completedHighlights.map((highlight) => (
                <div key={highlight!.artic_id} className="gallery-card p-2">
                  {highlight!.image_url && (
                    <div className="aspect-square mb-2 artwork-frame rounded-sm overflow-hidden">
                      <img
                        src={highlight!.image_url}
                        alt={highlight!.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-display text-sm font-semibold leading-tight line-clamp-2">
                    {highlight!.title}
                  </h3>
                  {highlight!.artist && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {highlight!.artist}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ScrollArea>
  );
}
