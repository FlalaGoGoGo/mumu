import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react'; // kept for empty state icon
import { useProducts } from '@/hooks/useProducts';
import { useMuseums } from '@/hooks/useMuseums';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopFilters, SortOption } from '@/components/shop/ShopFilters';
import { FeaturedStrip } from '@/components/shop/FeaturedStrip';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function ShopPage() {
  const { data: products = [], isLoading } = useProducts();
  const { data: museums = [] } = useMuseums();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [museum, setMuseum] = useState('');
  const [sort, setSort] = useState<SortOption>('recommended');
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  // Museum lookup map
  const museumMap = useMemo(() => {
    const map: Record<string, string> = {};
    museums.forEach((m) => { map[m.museum_id] = m.name; });
    return map;
  }, [museums]);

  // Unique categories from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => { if (p.tags) set.add(p.tags); });
    return Array.from(set).sort();
  }, [products]);

  // Unique museums from products
  const museumOptions = useMemo(() => {
    const ids = new Set<string>();
    products.forEach((p) => { if (p.museum_id) ids.add(p.museum_id); });
    return Array.from(ids).map((id) => ({
      id,
      name: museumMap[id] || id,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, museumMap]);

  // Price bounds
  const { priceMin, priceMax } = useMemo(() => {
    if (products.length === 0) return { priceMin: 0, priceMax: 500 };
    const prices = products.map((p) => Number(p.price));
    return { priceMin: Math.min(...prices), priceMax: Math.max(...prices) };
  }, [products]);

  const effectivePriceRange = priceRange || [priceMin, priceMax];

  // Featured products (unfiltered)
  const featured = useMemo(() => products.filter((p) => p.is_featured), [products]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (category) {
      result = result.filter((p) => p.tags === category);
    }
    if (museum) {
      result = result.filter((p) => p.museum_id === museum);
    }
    const [min, max] = effectivePriceRange;
    result = result.filter((p) => Number(p.price) >= min && Number(p.price) <= max);

    switch (sort) {
      case 'price_asc':
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      default: // recommended — featured first
        result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return result;
  }, [products, search, category, museum, effectivePriceRange, sort]);

  const hasActiveFilters = !!search || !!category || !!museum || !!priceRange;

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setMuseum('');
    setPriceRange(null);
    setSort('recommended');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Museum Shop</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated finds from world-renowned museum stores
        </p>
      </div>

      {/* Featured strip */}
      {!isLoading && featured.length > 0 && (
        <FeaturedStrip
          products={featured}
          museumMap={museumMap}
          isWishlisted={isWishlisted}
          onToggleWishlist={toggleWishlist}
        />
      )}

      {/* Filters — sticky frosted glass */}
      {!isLoading && (
        <div className="sticky top-0 z-[1500] -mx-4 mb-4 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
          <ShopFilters
            search={search}
            onSearchChange={setSearch}
            categories={categories}
            selectedCategory={category}
            onCategoryChange={setCategory}
            museums={museumOptions}
            selectedMuseum={museum}
            onMuseumChange={setMuseum}
            priceRange={effectivePriceRange}
            priceMin={priceMin}
            priceMax={priceMax}
            onPriceChange={(v) => setPriceRange(v)}
            sort={sort}
            onSortChange={setSort}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-sm" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Product grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.product_id}
              product={p}
              museumName={p.museum_id ? museumMap[p.museum_id] : undefined}
              isWishlisted={isWishlisted(p.product_id)}
              onToggleWishlist={toggleWishlist}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">No products found</h3>
          <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters.</p>
          <Button variant="outline" size="sm" onClick={clearFilters}>Reset filters</Button>
        </div>
      )}

      {/* Count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-4">
          Showing {filtered.length} of {products.length} products
        </p>
      )}
    </div>
  );
}
