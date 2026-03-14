import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ArtworkMovement } from '@/types/movement';

type CountMode = 'events' | 'artworks';

interface Props {
  movements: ArtworkMovement[];
  selectedYear: number | null;
  onYearSelect: (year: number | null) => void;
  hoveredYear: number | null;
  onYearHover: (year: number | null) => void;
}

interface YearRow {
  year: number;
  inflow_events: number;
  outflow_events: number;
  net_events: number;
  inflow_artworks: number;
  outflow_artworks: number;
  net_artworks: number;
}

export function AnnualFlowChart({ movements, selectedYear, onYearSelect, hoveredYear, onYearHover }: Props) {
  const [countMode, setCountMode] = useState<CountMode>('events');

  const yearData = useMemo(() => {
    const map = new Map<number, {
      inEvents: number; outEvents: number;
      inArtworks: Set<string>; outArtworks: Set<string>;
    }>();

    for (const m of movements) {
      if (!m.start_date) continue;
      const y = parseInt(m.start_date.substring(0, 4));
      if (isNaN(y)) continue;
      if (!map.has(y)) map.set(y, { inEvents: 0, outEvents: 0, inArtworks: new Set(), outArtworks: new Set() });
      const row = map.get(y)!;
      row.outEvents++;
      row.outArtworks.add(m.artwork_id);
      row.inEvents++;
      row.inArtworks.add(m.artwork_id);
    }

    const result: YearRow[] = [];
    for (const [year, d] of map) {
      result.push({
        year,
        inflow_events: d.inEvents,
        outflow_events: -d.outEvents, // negative for mirrored chart
        net_events: d.inEvents - d.outEvents,
        inflow_artworks: d.inArtworks.size,
        outflow_artworks: -d.outArtworks.size,
        net_artworks: d.inArtworks.size - d.outArtworks.size,
      });
    }
    return result.sort((a, b) => a.year - b.year);
  }, [movements]);

  // For per-museum flow we need direction-aware counting
  const yearDataDirectional = useMemo(() => {
    const map = new Map<number, {
      inEvents: number; outEvents: number;
      inArtworks: Set<string>; outArtworks: Set<string>;
    }>();

    for (const m of movements) {
      if (!m.start_date) continue;
      const y = parseInt(m.start_date.substring(0, 4));
      if (isNaN(y)) continue;
      if (!map.has(y)) map.set(y, { inEvents: 0, outEvents: 0, inArtworks: new Set(), outArtworks: new Set() });
      const row = map.get(y)!;
      // Each movement is one outflow from lender, one inflow to borrower
      // At aggregate artist level: total events per year
      row.inEvents++;
      row.inArtworks.add(m.artwork_id);
      row.outEvents++;
      row.outArtworks.add(m.artwork_id);
    }

    const result: YearRow[] = [];
    for (const [year, d] of map) {
      result.push({
        year,
        inflow_events: d.inEvents,
        outflow_events: d.outEvents,
        net_events: 0,
        inflow_artworks: d.inArtworks.size,
        outflow_artworks: d.outArtworks.size,
        net_artworks: 0,
      });
    }
    return result.sort((a, b) => a.year - b.year);
  }, [movements]);

  const inflowKey = countMode === 'events' ? 'inflow_events' : 'inflow_artworks';
  const outflowKey = countMode === 'events' ? 'outflow_events' : 'outflow_artworks';
  const metricLabel = countMode === 'events' ? 'Movement Events' : 'Unique Artworks';

  return (
    <Card className="border-border/60">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold">Annual Movement Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Movement events per year · Click a bar to focus
            </p>
          </div>
          <div className="flex gap-0.5 rounded-md border border-border/60 p-0.5">
            <Button
              variant={countMode === 'events' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setCountMode('events')}
            >
              Event Count
            </Button>
            <Button
              variant={countMode === 'artworks' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setCountMode('artworks')}
            >
              Unique Artworks
            </Button>
          </div>
        </div>

        {yearDataDirectional.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={yearDataDirectional}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              onClick={(state) => {
                if (state?.activePayload?.[0]?.payload) {
                  const yr = state.activePayload[0].payload.year;
                  onYearSelect(selectedYear === yr ? null : yr);
                }
              }}
              onMouseMove={(state) => {
                if (state?.activePayload?.[0]?.payload) {
                  onYearHover(state.activePayload[0].payload.year);
                }
              }}
              onMouseLeave={() => onYearHover(null)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10 }}
                tickFormatter={(y) => String(y)}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} width={35} />
              <RechartsTooltip
                content={({ payload, label }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg px-3 py-2 text-xs shadow-md space-y-1">
                      <p className="font-semibold">{label}</p>
                      <p>Events: <span className="font-medium">{d.inflow_events}</span></p>
                      <p>Unique Artworks: <span className="font-medium">{d.inflow_artworks}</span></p>
                      <p className="text-[10px] text-muted-foreground">Showing: {metricLabel}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey={inflowKey} radius={[3, 3, 0, 0]} maxBarSize={24}>
                {yearDataDirectional.map((d) => {
                  const isSelected = selectedYear === d.year;
                  const isHovered = hoveredYear === d.year;
                  return (
                    <Cell
                      key={d.year}
                      fill={isSelected ? 'hsl(348, 60%, 45%)' : 'hsl(348, 45%, 42%)'}
                      fillOpacity={isSelected ? 1 : isHovered ? 0.85 : selectedYear ? 0.3 : 0.7}
                      cursor="pointer"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No annual data available</p>
        )}

        {selectedYear && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Focused: <span className="font-semibold text-foreground">{selectedYear}</span>
            </span>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => onYearSelect(null)}>
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
