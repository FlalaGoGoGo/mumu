import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';
import type { MuseumCategory } from './CategoryFilterDropdown';

interface ActiveFilter {
  type: 'category' | 'location' | 'distance' | 'mustVisit' | 'openToday';
  label: string;
  value: string;
}

interface ActiveFiltersProps {
  categories: MuseumCategory[];
  locationCountry: string | null;
  locationState: string | null;
  locationCity: string | null;
  maxDistance: number | null;
  mustVisit: boolean;
  openToday?: boolean;
  onRemoveCategory: (category: MuseumCategory) => void;
  onClearLocation: () => void;
  onClearDistance: () => void;
  onClearMustVisit: () => void;
  onClearOpenToday?: () => void;
  onClearAll: () => void;
}

export function ActiveFilters({
  categories,
  locationCountry,
  locationState,
  locationCity,
  maxDistance,
  mustVisit,
  openToday,
  onRemoveCategory,
  onClearLocation,
  onClearDistance,
  onClearMustVisit,
  onClearOpenToday,
  onClearAll,
}: ActiveFiltersProps) {
  const { t } = useLanguage();

  const filters: ActiveFilter[] = [];

  // Add category filters
  categories.forEach(cat => {
    filters.push({
      type: 'category',
      label: t(`category.${cat}` as any),
      value: cat,
    });
  });

  // Add location filter
  if (locationCountry || locationState || locationCity) {
    const parts: string[] = [];
    if (locationCountry) parts.push(locationCountry);
    if (locationState) parts.push(locationState);
    if (locationCity) parts.push(locationCity);
    filters.push({
      type: 'location',
      label: parts.join(' · '),
      value: 'location',
    });
  }

  // Add distance filter
  if (maxDistance !== null) {
    filters.push({
      type: 'distance',
      label: `≤ ${maxDistance >= 1000 ? `${(maxDistance / 1000).toFixed(1)}k` : maxDistance} mi`,
      value: 'distance',
    });
  }

  // Add must-visit filter
  if (mustVisit) {
    filters.push({
      type: 'mustVisit',
      label: t('map.mustVisit'),
      value: 'mustVisit',
    });
  }

  // Add open today filter
  if (openToday) {
    filters.push({
      type: 'openToday',
      label: 'Open Today',
      value: 'openToday',
    });
  }

  if (filters.length === 0) return null;

  const handleRemove = (filter: ActiveFilter) => {
    switch (filter.type) {
      case 'category':
        onRemoveCategory(filter.value as MuseumCategory);
        break;
      case 'location':
        onClearLocation();
        break;
      case 'distance':
        onClearDistance();
        break;
      case 'mustVisit':
        onClearMustVisit();
        break;
      case 'openToday':
        onClearOpenToday?.();
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.map((filter, index) => (
        <span
          key={`${filter.type}-${filter.value}-${index}`}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            "bg-primary/10 text-primary border border-primary/20"
          )}
        >
          {filter.label}
          <button
            onClick={() => handleRemove(filter)}
            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
        >
          {t('common.clear')} all
        </button>
      )}
    </div>
  );
}
