import { useQuery } from '@tanstack/react-query';
import type { StoreProduct } from '@/types/product';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function fetchProductsFromCSV(): Promise<StoreProduct[]> {
  const response = await fetch('/data/store_products.csv');
  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(headerLine);

  const products: StoreProduct[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      let value: unknown = values[index] ?? '';

      // Map CSV column names to our type
      let key = header;
      if (key === 'image_url1') key = 'image_url';

      if (key === 'is_featured') {
        value = value === 'TRUE' || value === 'true';
      } else if (key === 'price') {
        const num = parseFloat(value as string);
        value = isNaN(num) ? 0 : num;
      }

      obj[key] = value;
    });

    if (obj.product_id) {
      // Ensure created_at has a default
      if (!obj.created_at) obj.created_at = new Date().toISOString();
      products.push(obj as unknown as StoreProduct);
    }
  }

  return products.sort((a, b) => a.title.localeCompare(b.title));
}

export function useProducts() {
  return useQuery({
    queryKey: ['store-products'],
    queryFn: fetchProductsFromCSV,
    staleTime: Infinity,
  });
}

export function useProduct(productId: string | undefined) {
  const { data: products, isLoading, error } = useProducts();

  return {
    data: productId ? products?.find(p => p.product_id === productId) || null : null,
    isLoading,
    error,
  };
}
