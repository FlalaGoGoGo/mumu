import { Heart, ImageOff, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { StoreProduct } from '@/types/product';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: StoreProduct;
  museumName?: string;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
}

export function ProductCard({ product, museumName, isWishlisted, onToggleWishlist }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [img2Error, setImg2Error] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);

  const primaryImage = product.image_url;
  const secondaryImage = product.image_url2;
  const hasSecondary = !!secondaryImage && !img2Error;

  const formattedPrice = product.currency === 'USD'
    ? `$${Number(product.price).toFixed(0)}`
    : `${Number(product.price).toFixed(0)} ${product.currency}`;

  return (
    <div className="gallery-card p-0 overflow-hidden flex flex-col h-full border-gold-border/30 hover:border-gold-border/60 transition-all duration-200">
      {/* Image — square 1:1, hover swap isolated to this area */}
      <Link
        to={`/shop/${product.product_id}`}
        className="block relative aspect-square bg-muted overflow-hidden flex-shrink-0"
        onMouseEnter={() => hasSecondary && setIsImageHovered(true)}
        onMouseLeave={() => setIsImageHovered(false)}
      >
        {!imgError && primaryImage ? (
          <>
            {/* Primary image */}
            <img
              src={primaryImage}
              alt={product.title}
              className={cn(
                'absolute inset-0 w-full h-full object-contain transition-opacity duration-200',
                isImageHovered && hasSecondary ? 'opacity-0' : 'opacity-100',
              )}
              onError={() => setImgError(true)}
              loading="lazy"
            />
            {/* Secondary image — preloaded, shown on hover */}
            {hasSecondary && (
              <img
                src={secondaryImage}
                alt={`${product.title} – alternate view`}
                className={cn(
                  'absolute inset-0 w-full h-full object-contain transition-opacity duration-200',
                  isImageHovered ? 'opacity-100' : 'opacity-0',
                )}
                onError={() => setImg2Error(true)}
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="w-10 h-10" />
          </div>
        )}
        {product.is_featured && (
          <span className="absolute top-2 left-2 museum-chip text-[10px] bg-accent text-accent-foreground border-accent">
            Featured
          </span>
        )}
      </Link>

      {/* Info — flex-grow to fill remaining space */}
      <div className="p-3 flex flex-col flex-1 gap-1.5 min-h-0">
        <Link to={`/shop/${product.product_id}`} className="hover:underline">
          <h3 className="font-display text-sm font-semibold leading-tight line-clamp-2 text-foreground">
            {product.title}
          </h3>
        </Link>
        {museumName && (
          <p className="text-[11px] text-muted-foreground line-clamp-1">{museumName}</p>
        )}
        {product.tags && (
          <span className="museum-chip text-[9px] w-fit">{product.tags}</span>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-display text-lg font-bold text-foreground">{formattedPrice}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.preventDefault(); onToggleWishlist(product.product_id); }}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
              />
            </Button>
            {product.official_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <a href={product.official_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
