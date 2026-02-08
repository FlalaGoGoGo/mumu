export interface StoreProduct {
  product_id: string;
  title: string;
  /** Primary cover image (backward-compat: may be stored as image_url in DB) */
  image_url: string | null;
  /** Secondary / alternate image shown on hover or in gallery */
  image_url2: string | null;
  price: number;
  currency: string;
  museum_id: string | null;
  official_url: string | null;
  tags: string | null;
  is_featured: boolean;
  created_at: string;
}
