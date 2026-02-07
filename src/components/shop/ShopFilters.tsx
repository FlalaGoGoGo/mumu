import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/lib/i18n';
import { useState } from 'react';

export type SortOption = 'recommended' | 'price_asc' | 'price_desc';

interface ShopFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (v: string) => void;
  museums: { id: string; name: string }[];
  selectedMuseum: string;
  onMuseumChange: (v: string) => void;
  priceRange: [number, number];
  priceMin: number;
  priceMax: number;
  onPriceChange: (v: [number, number]) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function ShopFilters({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  museums,
  selectedMuseum,
  onMuseumChange,
  priceRange,
  priceMin,
  priceMax,
  onPriceChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: ShopFiltersProps) {
  const { t } = useLanguage();
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="pl-9 h-9 text-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Category chips + Museum + Price */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Category chips */}
        <button
          onClick={() => onCategoryChange('')}
          className={`museum-chip cursor-pointer transition-colors text-[10px] ${
            !selectedCategory ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(selectedCategory === cat ? '' : cat)}
            className={`museum-chip cursor-pointer transition-colors text-[10px] ${
              selectedCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
            }`}
          >
            {cat}
          </button>
        ))}

        <div className="ml-auto flex gap-2 items-center">
          {/* Museum dropdown */}
          <Select value={selectedMuseum || '__all__'} onValueChange={(v) => onMuseumChange(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All Museums" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="__all__">All Museums</SelectItem>
              {museums.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price toggle */}
          <Button
            variant={showPriceFilter ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => setShowPriceFilter(!showPriceFilter)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Price
          </Button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={onClearFilters}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Price slider row */}
      {showPriceFilter && (
        <div className="flex items-center gap-4 px-1 py-2 bg-muted/50 rounded-sm">
          <span className="text-xs text-muted-foreground min-w-[40px]">${priceRange[0]}</span>
          <Slider
            value={priceRange}
            min={priceMin}
            max={priceMax}
            step={1}
            onValueChange={(v) => onPriceChange(v as [number, number])}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground min-w-[40px] text-right">${priceRange[1]}</span>
        </div>
      )}
    </div>
  );
}
