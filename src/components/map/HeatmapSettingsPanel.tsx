import { useState } from 'react';
import { X, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { type HeatmapParams, PRESETS, DEFAULT_PARAMS } from './heatmapDefaults';

interface HeatmapSettingsPanelProps {
  params: HeatmapParams;
  onChange: (params: HeatmapParams) => void;
  onClose: () => void;
  museumCount: number;
  hasVisitedData?: boolean;
  hasWishListData?: boolean;
}

const presetOptions: { value: HeatmapParams['preset']; label: string }[] = [
  { value: 'soft', label: 'Soft' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'punchy', label: 'Punchy' },
];

export function HeatmapSettingsPanel({
  params,
  onChange,
  onClose,
  museumCount,
  hasVisitedData = false,
  hasWishListData = false,
}: HeatmapSettingsPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const update = (patch: Partial<HeatmapParams>) => {
    const next = { ...params, ...patch };
    // If user changes a slider, mark preset as custom (keep current preset label but don't auto-snap)
    onChange(next);
  };

  const selectPreset = (preset: HeatmapParams['preset']) => {
    onChange({ ...params, preset, ...PRESETS[preset] });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_PARAMS });
  };

  return (
    <div className="w-[260px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-semibold text-foreground font-display">Heatmap Settings</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-3 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Empty data notice */}
        {museumCount === 0 && (
          <p className="text-xs text-muted-foreground bg-muted rounded px-2 py-1.5">No data to display for current filters.</p>
        )}

        {/* Presets */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Preset</p>
          <div className="flex rounded-md border border-border overflow-hidden">
            {presetOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => selectPreset(opt.value)}
                className={cn(
                  'flex-1 text-xs font-medium py-1.5 transition-colors',
                  params.preset === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:bg-muted'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <SliderRow label="Radius" helpLeft="Small" helpRight="Large" value={params.radius} onChange={v => update({ radius: v })} />
        <SliderRow label="Intensity" helpLeft="Low" helpRight="High" value={params.intensity} onChange={v => update({ intensity: v })} />
        <SliderRow label="Blur" helpLeft="Sharp" helpRight="Smooth" value={params.blur} onChange={v => update({ blur: v })} />
        <SliderRow label="Opacity" helpLeft="0%" helpRight="100%" value={params.opacity} onChange={v => update({ opacity: v })} />

        {/* Legend toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Show legend</span>
          <Switch checked={params.showLegend} onCheckedChange={v => update({ showLegend: v })} />
        </div>

        {/* Reset */}
        <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={handleReset}>
          <RotateCcw className="h-3 w-3 mr-1.5" />
          Reset to Balanced
        </Button>

        {/* Advanced */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
            Advanced
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', advancedOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {/* Normalization */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Normalization</p>
              <div className="flex rounded-md border border-border overflow-hidden">
                {(['global', 'viewport'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => update({ normalization: mode })}
                    className={cn(
                      'flex-1 text-xs font-medium py-1.5 capitalize transition-colors',
                      params.normalization === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-foreground hover:bg-muted'
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Clamp outliers */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-foreground block">Clamp outliers</span>
                <span className="text-[10px] text-muted-foreground">Top 95% — prevents flat contrast</span>
              </div>
              <Switch checked={params.clampOutliers} onCheckedChange={v => update({ clampOutliers: v })} />
            </div>

            {/* Data source */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Data source</p>
              <div className="flex flex-col gap-1">
                {[
                  { value: 'all' as const, label: 'All museums' },
                  { value: 'filtered' as const, label: 'Filtered results' },
                  ...(hasVisitedData || hasWishListData ? [{ value: 'my' as const, label: 'My museums' }] : []),
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update({ dataSource: opt.value })}
                    className={cn(
                      'text-left text-xs px-2 py-1 rounded transition-colors',
                      params.dataSource === opt.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weighting */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Weighting</p>
              <div className="flex flex-col gap-1">
                {[
                  { value: 'count' as const, label: 'Count only' },
                  { value: 'boost-must-visit' as const, label: 'Boost Must-Visit' },
                  ...(hasWishListData ? [{ value: 'boost-wish-list' as const, label: 'Boost Wish List' }] : []),
                  ...(hasVisitedData ? [{ value: 'boost-visited' as const, label: 'Boost Visited' }] : []),
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => update({ weighting: opt.value })}
                    className={cn(
                      'text-left text-xs px-2 py-1 rounded transition-colors',
                      params.weighting === opt.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

/* Reusable slider row */
function SliderRow({ label, helpLeft, helpRight, value, onChange }: {
  label: string; helpLeft: string; helpRight: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="text-[10px] tabular-nums text-muted-foreground">{value}%</span>
      </div>
      <Slider min={5} max={100} step={1} value={[value]} onValueChange={([v]) => onChange(v)} className="w-full" />
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-muted-foreground">{helpLeft}</span>
        <span className="text-[10px] text-muted-foreground">{helpRight}</span>
      </div>
    </div>
  );
}
