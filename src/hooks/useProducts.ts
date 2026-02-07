import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StoreProduct } from '@/types/product';

export function useProducts() {
  return useQuery({
    queryKey: ['store-products'],
    queryFn: async (): Promise<StoreProduct[]> => {
      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .order('title');

      if (error) throw error;
      return (data as unknown as StoreProduct[]) || [];
    },
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['store-product', productId],
    queryFn: async (): Promise<StoreProduct | null> => {
      if (!productId) return null;

      const { data, error } = await supabase
        .from('store_products')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) throw error;
      return data as unknown as StoreProduct;
    },
    enabled: !!productId,
  });
}
