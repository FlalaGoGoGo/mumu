import { useLanguage } from '@/lib/i18n';

export function HeatmapLegend() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-md px-2.5 py-1.5 shadow-md border border-border">
      <span className="text-[10px] font-medium text-muted-foreground">{t('heatmap.legend.low')}</span>
      <div
        className="h-2.5 w-20 rounded-full"
        style={{
          background: 'linear-gradient(to right, hsl(43, 60%, 70%), hsl(348, 45%, 50%), hsl(348, 45%, 32%))',
        }}
      />
      <span className="text-[10px] font-medium text-muted-foreground">{t('heatmap.legend.high')}</span>
    </div>
  );
}
