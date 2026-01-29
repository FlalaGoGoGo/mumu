import { useState } from 'react';
import { useRouteHighlights } from '@/hooks/useHighlights';
import { useHighlightCompletions, useToggleHighlightCompletion } from '@/hooks/usePassport';
import { HighlightCard } from '@/components/plan/HighlightCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MapPin, ExternalLink, Check } from 'lucide-react';

type RouteType = '1h' | 'full';

export default function PlanPage() {
  const [routeType, setRouteType] = useState<RouteType>('1h');
  const { data: highlights = [], isLoading } = useRouteHighlights();
  const { data: completions = [] } = useHighlightCompletions();
  const toggleCompletion = useToggleHighlightCompletion();

  const completedIds = new Set(completions.map(c => c.artic_id));
  
  // For 1h route, take first 8 highlights ordered by route_1h_order
  const routeHighlights = routeType === '1h' 
    ? highlights.slice(0, 8) 
    : highlights;

  const completedCount = routeHighlights.filter(h => completedIds.has(h.artic_id)).length;
  const progress = routeHighlights.length > 0 
    ? Math.round((completedCount / routeHighlights.length) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="w-64 h-8 mb-4" />
        <Skeleton className="w-full h-24 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-full h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-73px)] flex flex-col md:flex-row">
      {/* Desktop: Info Panel */}
      <div className="md:w-80 lg:w-96 p-6 border-b md:border-b-0 md:border-r border-border bg-card">
        {/* Museum Header */}
        <div className="mb-6">
          <span className="museum-chip mb-3">Full Guide Available</span>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-3">
            The Art Institute of Chicago
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
            <MapPin className="w-4 h-4" />
            <span>111 S Michigan Ave, Chicago</span>
          </div>
        </div>

        {/* Route Selection */}
        <div className="mb-6">
          <h2 className="font-display text-lg font-semibold mb-3">Select Route</h2>
          <div className="flex gap-2">
            <Button
              variant={routeType === '1h' ? 'default' : 'outline'}
              onClick={() => setRouteType('1h')}
              className="flex-1"
            >
              <Clock className="w-4 h-4 mr-2" />
              1 Hour
            </Button>
            <Button
              variant={routeType === 'full' ? 'default' : 'outline'}
              onClick={() => setRouteType('full')}
              className="flex-1"
            >
              Full Tour
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{completedCount}/{routeHighlights.length}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <div className="flex items-center gap-2 text-accent text-sm mt-2">
              <Check className="w-4 h-4" />
              Route complete!
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="p-4 bg-muted/50 rounded-sm">
          <h3 className="font-display font-semibold mb-2">Route Info</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tap artworks to mark as seen</li>
            <li>• Follow gallery numbers in order</li>
            <li>• Allow ~{routeType === '1h' ? '60' : '120'}+ minutes</li>
          </ul>
        </div>

        {/* Visit Website */}
        <Button variant="outline" className="w-full mt-6" asChild>
          <a href="https://www.artic.edu" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Official Website
          </a>
        </Button>
      </div>

      {/* Highlights List */}
      <div className="flex-1">
        <ScrollArea className="h-[calc(100vh-350px)] md:h-[calc(100vh-73px)]">
          <div className="p-4 md:p-6">
            <h2 className="font-display text-xl font-semibold mb-4">
              {routeType === '1h' ? '1-Hour Highlights' : 'Complete Collection'}
            </h2>
            <div className="space-y-3">
              {routeHighlights.map((highlight, index) => (
                <HighlightCard
                  key={highlight.artic_id}
                  highlight={highlight}
                  order={index + 1}
                  isCompleted={completedIds.has(highlight.artic_id)}
                  onToggleComplete={() => 
                    toggleCompletion.mutate({
                      articId: highlight.artic_id,
                      isCompleted: completedIds.has(highlight.artic_id),
                    })
                  }
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
