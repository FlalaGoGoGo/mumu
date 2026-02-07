export interface StoreProduct {
  product_id: string;
  title: string;
  image_url: string | null;
  price: number;
  currency: string;
  museum_id: string | null;
  official_url: string | null;
  tags: string | null;
  is_featured: boolean;
  created_at: string;
}
