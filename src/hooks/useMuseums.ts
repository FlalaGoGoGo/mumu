import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Museum } from '@/types/museum';

/**
 * Fetch all museums from Supabase (cached, for lookup use cases).
 * Uses range queries to get beyond the 1000-row default limit.
 */
async function fetchAllMuseums(): Promise<Museum[]> {
  const museums: Museum[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('museums')
      .select('museum_id, name, city, state, country, lat, lng, address, website_url, opening_hours, has_full_content, hero_image_url, tags, highlight')
      .order('name')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    museums.push(...(data as unknown as Museum[]));
    if (data.length < pageSize) {
      hasMore = false;
    } else {
      from += pageSize;
    }
  }

  return museums;
}

export function useMuseums() {
  return useQuery({
    queryKey: ['museums'],
    queryFn: fetchAllMuseums,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useMuseum(museumId: string | null) {
  return useQuery({
    queryKey: ['museum', museumId],
    queryFn: async () => {
      if (!museumId) return null;
      const { data, error } = await supabase
        .from('museums')
        .select('*')
        .eq('museum_id', museumId)
        .single();
      if (error) throw error;
      return data as unknown as Museum;
    },
    enabled: !!museumId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Paginated museums with server-side filtering.
 */
export interface MuseumPageParams {
  page: number;
  pageSize?: number;
  search?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  category?: string | null;
  highlightOnly?: boolean;
  lat?: number | null;
  lng?: number | null;
  maxDistanceKm?: number | null;
}

export interface MuseumPageResult {
  total: number;
  page: number;
  page_size: number;
  data: (Museum & { distance_km?: number | null })[];
}

export function useMuseumsPage(params: MuseumPageParams) {
  return useQuery({
    queryKey: ['museums-page', params],
    queryFn: async (): Promise<MuseumPageResult> => {
      const { data, error } = await supabase.rpc('get_museums_page', {
        p_page: params.page,
        p_page_size: params.pageSize ?? 20,
        p_search: params.search || null,
        p_country: params.country || null,
        p_state: params.state || null,
        p_city: params.city || null,
        p_category: params.category || null,
        p_highlight_only: params.highlightOnly ?? false,
        p_lat: params.lat ?? null,
        p_lng: params.lng ?? null,
        p_max_distance_km: params.maxDistanceKm ?? null,
      });
      if (error) throw error;
      return data as unknown as MuseumPageResult;
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Museums within a bounding box (for map viewport).
 */
export interface BboxParams {
  west: number;
  south: number;
  east: number;
  north: number;
  category?: string | null;
  highlightOnly?: boolean;
}

export function useMuseumsInBbox(params: BboxParams | null) {
  return useQuery({
    queryKey: ['museums-bbox', params],
    queryFn: async (): Promise<Museum[]> => {
      if (!params) return [];
      const { data, error } = await supabase.rpc('get_museums_in_bbox', {
        p_west: params.west,
        p_south: params.south,
        p_east: params.east,
        p_north: params.north,
        p_category: params.category || null,
        p_highlight_only: params.highlightOnly ?? false,
      });
      if (error) throw error;
      return (data as unknown as Museum[]) ?? [];
    },
    enabled: !!params,
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });
}
