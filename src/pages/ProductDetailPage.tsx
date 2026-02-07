import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Heart, Share2, ImageOff, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useMuseums } from '@/hooks/useMuseums';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/shop/ProductCard';
import { toast } from '@/hooks/use-toast';

export default function ProductDetailPage() {
  const { product_id } = useParams<{ product_id: string }>();
  const { data: product, isLoading } = useProduct(product_id);
  const { data: allProducts = [] } = useProducts();
  const { data: museums = [] } = useMuseums();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [imgError, setImgError] = useState(false);

  const museumName = product?.museum_id
    ? museums.find((m) => m.museum_id === product.museum_id)?.name || product.museum_id
    : null;

  const museumMap: Record<string, string> = {};
  museums.forEach((m) => { museumMap[m.museum_id] = m.name; });

  const formattedPrice = product
    ? product.currency === 'USD'
      ? `$${Number(product.price).toFixed(0)}`
      : `${Number(product.price).toFixed(0)} ${product.currency}`
    : '';

  // Related: same museum or same tags, excluding self
  const related = allProducts
    .filter((p) => p.product_id !== product_id && product && (p.museum_id === product.museum_id || p.tags === product.tags))
    .slice(0, 6);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', description: 'Product link copied to clipboard.' });
    } catch {
      toast({ title: 'Share', description: url });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-sm" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold mb-2">Product not found</h2>
        <Link to="/shop" className="text-primary underline text-sm">← Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-8">
      {/* Back */}
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Shop
      </Link>

      {/* Product layout */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-muted rounded-sm overflow-hidden border border-gold-border/30">
          {!imgError && product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageOff className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {product.title}
            </h1>
            {museumName && (
              <p className="text-sm text-muted-foreground mt-1">From {museumName}</p>
            )}
          </div>

          <p className="font-display text-3xl font-bold text-foreground">{formattedPrice}</p>

          {product.tags && (
            <span className="museum-chip">{product.tags}</span>
          )}

          {/* CTA */}
          {product.official_url && (
            <div className="space-y-2 pt-2">
              <Button asChild className="w-full gap-2" size="lg">
                <a href={product.official_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Buy on Museum Store
                </a>
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Checkout happens on the museum's official store. MuMu does not process payments.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => toggleWishlist(product.product_id)}
            >
              <Heart
                className={`h-4 w-4 ${isWishlisted(product.product_id) ? 'fill-primary text-primary' : ''}`}
              />
              {isWishlisted(product.product_id) ? 'Wishlisted' : 'Add to Wishlist'}
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Related items */}
      {related.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border">
          <h2 className="font-display text-xl font-bold text-foreground">More like this</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((p) => (
              <ProductCard
                key={p.product_id}
                product={p}
                museumName={p.museum_id ? museumMap[p.museum_id] : undefined}
                isWishlisted={isWishlisted(p.product_id)}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
