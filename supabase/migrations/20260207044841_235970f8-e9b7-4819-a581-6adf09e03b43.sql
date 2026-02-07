
-- Create store_products table
CREATE TABLE public.store_products (
  product_id text NOT NULL PRIMARY KEY,
  title text NOT NULL,
  image_url text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  museum_id text,
  official_url text,
  tags text,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Public read access (products are a public catalog)
CREATE POLICY "Store products are publicly readable"
ON public.store_products
FOR SELECT
USING (true);
