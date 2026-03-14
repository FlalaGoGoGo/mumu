import { useState, useMemo } from 'react';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface SourceMuseumGroup {
  museum_id: string;
  museum_name: string;
  city: string;
  country: string;
  artworkCount: number;
  artworkTitles: string[];
  isVenue: boolean;
}

interface ExhibitionSourceMuseumsProps {
  groups: SourceMuseumGroup[];
  onMuseumClick?: (museumId: string) => void;
  highlightedMuseumId?: string | null;
}

export function ExhibitionSourceMuseums({
  groups,
  onMuseumClick,
  highlightedMuseumId,
}: ExhibitionSourceMuseumsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...groups].sort((a, b) => {
      // Venue first, then by artwork count descending
      if (a.isVenue !== b.isVenue) return a.isVenue ? -1 : 1;
      if (b.artworkCount !== a.artworkCount) return b.artworkCount - a.artworkCount;
      return a.museum_name.localeCompare(b.museum_name);
    });
  }, [groups]);

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-semibold text-foreground tracking-wide uppercase">
        Source Museums
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {sorted.length} {sorted.length === 1 ? 'museum' : 'museums'} contributing artworks to this exhibition.
      </p>

      <div className="space-y-1">
        {sorted.map((group) => {
          const isExpanded = expandedId === group.museum_id;
          const isHighlighted = highlightedMuseumId === group.museum_id;

          return (
            <div
              key={group.museum_id}
              className={`rounded-sm border transition-colors duration-150 ${
                isHighlighted
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-card/40 hover:bg-card/70'
              }`}
            >
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : group.museum_id);
                  onMuseumClick?.(group.museum_id);
                }}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5"
              >
                <Building2 className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold text-foreground truncate">
                      {group.museum_name}
                    </span>
                    {group.isVenue && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-accent/10 text-accent border-accent/30">
                        Venue
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {group.city}, {group.country}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-foreground tabular-nums">
                    {group.artworkCount}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && group.artworkTitles.length > 0 && (
                <div className="px-3 pb-2.5 pt-0 border-t border-border/50">
                  <ul className="space-y-0.5 mt-1.5">
                    {group.artworkTitles.map((title, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-7">
                        • {title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
