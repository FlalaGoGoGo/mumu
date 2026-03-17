import type { ArtworkMovement } from '@/types/movement';
import { ExternalLink } from 'lucide-react';
import { getMuseumDisplayName } from '@/lib/humanizeMuseumId';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  movements: ArtworkMovement[];
  museumMap: Map<string, MuseumPoint>;
}

export function JourneyTimeline({ movements, museumMap }: Props) {
  if (movements.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold">Movement Timeline</h3>
        <p className="text-xs text-muted-foreground">{movements.length} event{movements.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="divide-y max-h-[300px] overflow-y-auto">
        {movements.map((m, i) => (
          <div key={m.movement_id} className="p-3 flex gap-3 text-sm hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              {i < movements.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium truncate">
                  {getMuseumDisplayName(m.lender_museum_id, museumMap)} → {getMuseumDisplayName(m.borrower_museum_id, museumMap)}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap capitalize">{m.movement_type}</span>
              </div>
              <p className="text-xs text-muted-foreground">{m.start_date} – {m.end_date}</p>
              {m.related_exhibition_name && (
                <p className="text-xs italic text-muted-foreground truncate">{m.related_exhibition_name}</p>
              )}
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  m.confidence === 'HIGH' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                  m.confidence === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {m.confidence}
                </span>
                {m.source_url && (
                  <a href={m.source_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary hover:underline">
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
