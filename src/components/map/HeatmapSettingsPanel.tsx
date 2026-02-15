import { useState } from 'react';
import { X, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import { type HeatmapParams, PRESETS, DEFAULT_PARAMS } from './heatmapDefaults';

interface HeatmapSettingsPanelProps {
  params: HeatmapParams;
  onChange: (params: HeatmapParams) => void;
  onClose: () => void;
  museumCount: number;
  hasVisitedData?: boolean;
  hasWishListData?: boolean;
}

export function HeatmapSettingsPanel({
  params,
  onChange,
  onClose,
  museumCount,
  hasVisitedData = false,
  hasWishListData = false,
}: HeatmapSettingsPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { t } = useLanguage();

  const update = (patch: Partial<HeatmapParams>) => {
    onChange({ ...params, ...patch });
  };

  const selectPreset = (preset: HeatmapParams['preset']) => {
    onChange({ ...params, preset, ...PRESETS[preset] });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_PARAMS });
  };

  const presetOptions: { value: HeatmapParams['preset']; labelKey: 'heatmap.preset.soft' | 'heatmap.preset.balanced' | 'heatmap.preset.punchy' }[] = [
    { value: 'soft', labelKey: 'heatmap.preset.soft' },
    { value: 'balanced', labelKey: 'heatmap.preset.balanced' },
    { value: 'punchy', labelKey: 'heatmap.preset.punchy' },
  ];

  return (
    <div className="w-[260px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden" onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-semibold text-foreground font-display">{t('heatmap.settings')}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 py-3 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Empty data notice */}
        {museumCount === 0 && (
          <p className="text-xs text-muted-foreground bg-muted rounded px-2 py-1.5">{t('heatmap.noData')}</p>
        )}

        {/* Presets */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('heatmap.preset')}</p>
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
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <SliderRow label={t('heatmap.radius')} helpLeft={t('heatmap.radius.small')} helpRight={t('heatmap.radius.large')} value={params.radius} onChange={v => update({ radius: v })} />
        <SliderRow label={t('heatmap.intensity')} helpLeft={t('heatmap.intensity.low')} helpRight={t('heatmap.intensity.high')} value={params.intensity} onChange={v => update({ intensity: v })} />
        <SliderRow label={t('heatmap.blur')} helpLeft={t('heatmap.blur.sharp')} helpRight={t('heatmap.blur.smooth')} value={params.blur} onChange={v => update({ blur: v })} />
        <SliderRow label={t('heatmap.opacity')} helpLeft="0%" helpRight="100%" value={params.opacity} onChange={v => update({ opacity: v })} />

        {/* Legend toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">{t('heatmap.showLegend')}</span>
          <Switch checked={params.showLegend} onCheckedChange={v => update({ showLegend: v })} />
        </div>

        {/* Reset */}
        <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={handleReset}>
          <RotateCcw className="h-3 w-3 mr-1.5" />
          {t('heatmap.reset')}
        </Button>

        {/* Advanced */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
            {t('heatmap.advanced')}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', advancedOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {/* Normalization */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('heatmap.normalization')}</p>
              <div className="flex rounded-md border border-border overflow-hidden">
                {(['global', 'viewport'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => update({ normalization: mode })}
                    className={cn(
                      'flex-1 text-xs font-medium py-1.5 transition-colors',
                      params.normalization === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-foreground hover:bg-muted'
                    )}
                  >
                    {t(mode === 'global' ? 'heatmap.normalization.global' : 'heatmap.normalization.viewport')}
                  </button>
                ))}
              </div>
            </div>

            {/* Clamp outliers */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-foreground block">{t('heatmap.clampOutliers')}</span>
                <span className="text-[10px] text-muted-foreground">{t('heatmap.clampOutliersDesc')}</span>
              </div>
              <Switch checked={params.clampOutliers} onCheckedChange={v => update({ clampOutliers: v })} />
            </div>

            {/* Data source */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('heatmap.dataSource')}</p>
              <div className="flex flex-col gap-1">
                {[
                  { value: 'all' as const, labelKey: 'heatmap.dataSource.all' as const },
                  { value: 'filtered' as const, labelKey: 'heatmap.dataSource.filtered' as const },
                  ...(hasVisitedData || hasWishListData ? [{ value: 'my' as const, labelKey: 'heatmap.dataSource.my' as const }] : []),
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
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Weighting */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('heatmap.weighting')}</p>
              <div className="flex flex-col gap-1">
                {[
                  { value: 'count' as const, labelKey: 'heatmap.weighting.count' as const },
                  { value: 'boost-must-visit' as const, labelKey: 'heatmap.weighting.mustVisit' as const },
                  ...(hasWishListData ? [{ value: 'boost-wish-list' as const, labelKey: 'heatmap.weighting.wishList' as const }] : []),
                  ...(hasVisitedData ? [{ value: 'boost-visited' as const, labelKey: 'heatmap.weighting.visited' as const }] : []),
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
                    {t(opt.labelKey)}
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
