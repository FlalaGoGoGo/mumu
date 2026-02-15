export interface HeatmapParams {
  preset: 'soft' | 'balanced' | 'punchy';
  radius: number;
  intensity: number;
  blur: number;
  opacity: number;
  showLegend: boolean;
  normalization: 'global' | 'viewport';
  clampOutliers: boolean;
  dataSource: 'all' | 'filtered' | 'my';
  weighting: 'count' | 'boost-must-visit' | 'boost-wish-list' | 'boost-visited';
}

export const PRESETS: Record<'soft' | 'balanced' | 'punchy', Pick<HeatmapParams, 'radius' | 'intensity' | 'blur' | 'opacity'>> = {
  soft: { radius: 30, intensity: 40, blur: 25, opacity: 55 },
  balanced: { radius: 50, intensity: 60, blur: 50, opacity: 70 },
  punchy: { radius: 70, intensity: 85, blur: 30, opacity: 85 },
};

export const DEFAULT_PARAMS: HeatmapParams = {
  preset: 'balanced',
  ...PRESETS.balanced,
  showLegend: true,
  normalization: 'viewport',
  clampOutliers: true,
  dataSource: 'all',
  weighting: 'count',
};

const STORAGE_KEY = 'mumu-heatmap-settings';

export function loadHeatmapParams(): HeatmapParams {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PARAMS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_PARAMS };
}

export function saveHeatmapParams(params: HeatmapParams): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch { /* ignore */ }
}
