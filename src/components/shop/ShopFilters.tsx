import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  const activeFilterCount = (() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedMuseum) count++;
    if (priceRange[0] > priceMin || priceRange[1] < priceMax) count++;
    return count;
  })();

  const applyPrice = () => {
    let min = minInput ? Number(minInput) : priceMin;
    let max = maxInput ? Number(maxInput) : priceMax;
    if (isNaN(min)) min = priceMin;
    if (isNaN(max)) max = priceMax;
    if (min > max) [min, max] = [max, min];
    min = Math.max(min, priceMin);
    max = Math.min(max, priceMax);
    onPriceChange([min, max]);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applyPrice();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Search + Filters + Sort */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="pl-10"
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

        {/* Filters toggle */}
        <Button
          variant="outline"
          className="gap-2 h-10 flex-shrink-0"
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-10 text-sm flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Collapsible filter panel */}
      <Collapsible open={panelOpen} onOpenChange={setPanelOpen}>
        <CollapsibleContent>
          <div className="relative z-[2000] p-4 bg-muted/50 rounded-lg border space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Left: Category chips */}
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
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
              </div>

              {/* Right: Museum dropdown + Price inputs */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Museum dropdown */}
                <Select value={selectedMuseum || '__all__'} onValueChange={(v) => onMuseumChange(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="All Museums" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-[9999]">
                    <SelectItem value="__all__">All Museums</SelectItem>
                    {museums.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Min / Max price inputs */}
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    onBlur={applyPrice}
                    onKeyDown={handlePriceKeyDown}
                    className="w-[72px] h-8 text-xs px-2"
                    min={priceMin}
                    max={priceMax}
                  />
                  <span className="text-xs text-muted-foreground">–</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
                    onBlur={applyPrice}
                    onKeyDown={handlePriceKeyDown}
                    className="w-[72px] h-8 text-xs px-2"
                    min={priceMin}
                    max={priceMax}
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" />
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
