import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import type { ArtworkMovement } from '@/types/movement';

interface MuseumPoint {
  museum_id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  movements: ArtworkMovement[];
  museumMap: Map<string, MuseumPoint>;
  selectedYear: number | null;
  onArtworkSelect?: (artworkId: string) => void;
}

export function YearlyArtworkList({ movements, museumMap, selectedYear, onArtworkSelect }: Props) {
  const yearMovements = useMemo(() => {
    if (!selectedYear) return [];
    return movements
      .filter(m => {
        if (!m.start_date) return false;
        const y = parseInt(m.start_date.substring(0, 4));
        return y === selectedYear;
      })
      .sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
  }, [movements, selectedYear]);

  if (!selectedYear) return null;
  if (yearMovements.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-5 text-center">
          <p className="text-sm text-muted-foreground">No movement events in {selectedYear}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b border-border/60">
          <h3 className="text-sm font-semibold">
            Artworks Moved in {selectedYear}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {yearMovements.length} movement event{yearMovements.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Artwork</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">From</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">To</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                <th className="p-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {yearMovements.map((m, i) => {
                const lender = museumMap.get(m.lender_museum_id);
                const borrower = museumMap.get(m.borrower_museum_id);
                return (
                  <tr
                    key={`${m.movement_id}-${i}`}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => onArtworkSelect?.(m.artwork_id)}
                  >
                    <td className="p-3">
                      <p className="font-medium truncate max-w-[180px]">{m.artwork_title || m.artwork_id}</p>
                      <p className="text-[10px] text-muted-foreground sm:hidden truncate">
                        {lender?.name || '?'} → {borrower?.name || '?'}
                      </p>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground truncate max-w-[150px] hidden sm:table-cell">
                      {lender?.name || m.lender_museum_id}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground truncate max-w-[150px] hidden sm:table-cell">
                      {borrower?.name || m.borrower_museum_id}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {m.start_date?.substring(0, 10) || '—'}
                    </td>
                    <td className="p-3">
                      {m.source_url && (
                        <a
                          href={m.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
