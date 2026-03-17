import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { getMuseumDisplayName } from '@/lib/humanizeMuseumId';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
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
}

interface MuseumYearData {
  museum_id: string;
  name: string;
  inflow: number;
  outflow: number;
  net: number;
  inArtworks: number;
  outArtworks: number;
}

export function YearlyMuseumRankings({ movements, museumMap, selectedYear }: Props) {
  const isMobile = useIsMobile();
  const [expandedMuseum, setExpandedMuseum] = useState<string | null>(null);

  const yearMovements = useMemo(() => {
    if (!selectedYear) return movements;
    return movements.filter(m => {
      if (!m.start_date) return false;
      const y = parseInt(m.start_date.substring(0, 4));
      return y === selectedYear;
    });
  }, [movements, selectedYear]);

  const museumStats = useMemo(() => {
    const map = new Map<string, {
      inflow: number; outflow: number;
      inArtworks: Set<string>; outArtworks: Set<string>;
    }>();

    for (const m of yearMovements) {
      if (!map.has(m.lender_museum_id)) {
        map.set(m.lender_museum_id, { inflow: 0, outflow: 0, inArtworks: new Set(), outArtworks: new Set() });
      }
      const l = map.get(m.lender_museum_id)!;
      l.outflow++;
      l.outArtworks.add(m.artwork_id);

      if (!map.has(m.borrower_museum_id)) {
        map.set(m.borrower_museum_id, { inflow: 0, outflow: 0, inArtworks: new Set(), outArtworks: new Set() });
      }
      const b = map.get(m.borrower_museum_id)!;
      b.inflow++;
      b.inArtworks.add(m.artwork_id);
    }

    const result: MuseumYearData[] = [];
    for (const [id, s] of map) {
      result.push({
        museum_id: id,
        name: getMuseumDisplayName(id, museumMap),
        inflow: s.inflow,
        outflow: s.outflow,
        net: s.inflow - s.outflow,
        inArtworks: s.inArtworks.size,
        outArtworks: s.outArtworks.size,
      });
    }
    return result;
  }, [yearMovements, museumMap]);

  const topInflow = useMemo(() => [...museumStats].sort((a, b) => b.inflow - a.inflow).slice(0, 6), [museumStats]);
  const topOutflow = useMemo(() => [...museumStats].sort((a, b) => b.outflow - a.outflow).slice(0, 6), [museumStats]);

  const museumTrend = useMemo(() => {
    if (!expandedMuseum) return [];
    const yearMap = new Map<number, { inflow: number; outflow: number }>();
    for (const m of movements) {
      if (m.lender_museum_id !== expandedMuseum && m.borrower_museum_id !== expandedMuseum) continue;
      if (!m.start_date) continue;
      const y = parseInt(m.start_date.substring(0, 4));
      if (isNaN(y)) continue;
      if (!yearMap.has(y)) yearMap.set(y, { inflow: 0, outflow: 0 });
      const row = yearMap.get(y)!;
      if (m.borrower_museum_id === expandedMuseum) row.inflow++;
      if (m.lender_museum_id === expandedMuseum) row.outflow++;
    }
    return Array.from(yearMap.entries()).map(([year, d]) => ({ year, ...d })).sort((a, b) => a.year - b.year);
  }, [movements, expandedMuseum]);

  const expandedName = expandedMuseum ? getMuseumDisplayName(expandedMuseum, museumMap) : '';
  const label = selectedYear ? `in ${selectedYear}` : 'across all years';

  const renderRankList = (
    data: MuseumYearData[], direction: 'in' | 'out',
    icon: React.ReactNode, title: string, color: string,
  ) => (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        </div>
        <div className="space-y-1">
          {data.map((s, i) => {
            const value = direction === 'in' ? s.inflow : s.outflow;
            const artworkCount = direction === 'in' ? s.inArtworks : s.outArtworks;
            const isExpanded = expandedMuseum === s.museum_id;
            return (
              <div key={s.museum_id}>
                <div
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                    isExpanded ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/40'
                  )}
                  onClick={() => setExpandedMuseum(prev => prev === s.museum_id ? null : s.museum_id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{i + 1}</span>
                    <span className="truncate text-xs sm:text-sm">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{artworkCount} art</span>
                    <span className={cn("font-semibold tabular-nums", color)}>{value}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </div>
                {isExpanded && museumTrend.length > 1 && (
                  <div className="ml-7 mt-2 mb-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                    <p className="text-[10px] font-medium text-muted-foreground mb-2">Year trend for {expandedName}</p>
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={museumTrend} margin={{ left: 0, right: 5 }}>
                        <XAxis dataKey="year" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9 }} width={20} />
                        <RechartsTooltip
                          content={({ payload, label }) => {
                            if (!payload?.length) return null;
                            return (
                              <div className="bg-background border rounded px-2 py-1 text-[10px] shadow">
                                <p className="font-semibold">{label}</p>
                                <p className="text-green-700">In: {payload[0]?.value ?? 0}</p>
                                <p className="text-red-700">Out: {payload[1]?.value ?? 0}</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="inflow" fill="hsl(160, 50%, 40%)" radius={[2, 2, 0, 0]} maxBarSize={10} />
                        <Bar dataKey="outflow" fill="hsl(348, 45%, 42%)" radius={[2, 2, 0, 0]} maxBarSize={10} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })}
          {data.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">No data for this period</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-5'}>
      {renderRankList(topInflow, 'in', <TrendingUp className="h-4 w-4 text-green-600" />, 'Top Inflow Museums', 'text-green-700 dark:text-green-400')}
      {renderRankList(topOutflow, 'out', <TrendingDown className="h-4 w-4 text-red-600" />, 'Top Outflow Museums', 'text-red-700 dark:text-red-400')}
    </div>
  );
}
