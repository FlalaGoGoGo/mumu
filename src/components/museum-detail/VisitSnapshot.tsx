import { MapPin, Clock, ExternalLink, Ticket, Route, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { MuseumDetailOverview } from '@/types/museumDetail';

interface VisitSnapshotProps {
  overview: MuseumDetailOverview;
  onPlanVisit: () => void;
  onBuySmart: () => void;
}

export function VisitSnapshot({ overview, onPlanVisit, onBuySmart }: VisitSnapshotProps) {
  const [showEntrances, setShowEntrances] = useState(false);
  const snap = overview.visitSnapshot;

  return (
    <section className="space-y-5">
      {/* Status bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge
          variant={snap.openToday ? 'default' : 'destructive'}
          className={cn(
            'text-sm px-3 py-1 font-semibold',
            snap.openToday && 'bg-emerald-700 hover:bg-emerald-700'
          )}
        >
          {snap.statusLabel}
        </Badge>
        {snap.todayHours && (
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {snap.todayHours}
          </span>
        )}
        {snap.nextOpenLabel && (
          <span className="text-xs text-muted-foreground">
            {snap.nextOpenLabel}
          </span>
        )}
      </div>

      {/* Primary CTAs */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <Button onClick={onPlanVisit} size="lg" className="flex-1 sm:flex-none gap-2">
          <Route className="w-4 h-4" />
          Plan My Visit
        </Button>
        <Button variant="outline" onClick={onBuySmart} size="lg" className="flex-1 sm:flex-none gap-2">
          <Ticket className="w-4 h-4" />
          Buy Smart
        </Button>
        {snap.ticketUrl && (
          <Button variant="ghost" size="lg" className="flex-1 sm:flex-none gap-2" asChild>
            <a href={snap.ticketUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Official Tickets
            </a>
          </Button>
        )}
      </div>

      {/* Must-know facts */}
      {snap.mustKnow.length > 0 && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
          <p className="text-xs font-semibold text-accent-foreground/70 uppercase tracking-wider mb-2">
            Good to know
          </p>
          <ul className="space-y-1.5">
            {snap.mustKnow.map((fact, i) => (
              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-accent mt-0.5 text-xs">●</span>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Entrances */}
      {snap.entrances.length > 0 && (
        <div>
          <button
            onClick={() => setShowEntrances(!showEntrances)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            {snap.entrances.length} entrance{snap.entrances.length > 1 ? 's' : ''}
            {showEntrances ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showEntrances && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {snap.entrances.map((e) => (
                <div key={e.id} className="p-3 bg-card border border-border rounded-lg">
                  <p className="font-medium text-sm">{e.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{e.address}</p>
                  {e.recommendedFor && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">
                      {e.recommendedFor}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
