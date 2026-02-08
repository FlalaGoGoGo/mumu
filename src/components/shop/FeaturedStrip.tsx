import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import type { StoreProduct } from '@/types/product';

interface FeaturedStripProps {
  products: StoreProduct[];
  museumMap: Record<string, string>;
  isWishlisted: (id: string) => boolean;
  onToggleWishlist: (id: string) => void;
}

export function FeaturedStrip({ products, museumMap, isWishlisted, onToggleWishlist }: FeaturedStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">✦ Featured Picks</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => scroll('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => scroll('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((p) => (
          <div key={p.product_id} className="min-w-[180px] w-[200px] snap-start flex-shrink-0 self-stretch">
            <ProductCard
              product={p}
              museumName={p.museum_id ? museumMap[p.museum_id] : undefined}
              isWishlisted={isWishlisted(p.product_id)}
              onToggleWishlist={onToggleWishlist}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
