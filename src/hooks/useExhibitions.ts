import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Exhibition, ExhibitionStatus } from '@/types/exhibition';
import { computeDateLabel, parseRelatedArtworks } from '@/types/exhibition';

/**
 * Paginated exhibitions with server-side status sorting.
 */
export interface ExhibitionPageParams {
  page: number;
  pageSize?: number;
  search?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  statuses?: ExhibitionStatus[] | null;
  closingSoon?: boolean;
  dateFrom?: string | null;
  dateTo?: string | null;
}

interface RawExhibitionRow {
  exhibition_id: string;
  museum_id: string;
  exhibition_name: string;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  official_url: string | null;
  short_description: string | null;
  related_artworks: string | null;
  museum_name: string;
  city: string;
  state: string | null;
  country: string;
  museum_lat: number;
  museum_lng: number;
  status: string;
  status_rank: number;
}

export interface ExhibitionPageResult {
  total: number;
  page: number;
  page_size: number;
  data: Exhibition[];
}

function parseRow(raw: RawExhibitionRow): Exhibition {
  const startDate = raw.start_date ? new Date(raw.start_date + 'T00:00:00') : null;
  const endDate = raw.end_date ? new Date(raw.end_date + 'T00:00:00') : null;

  return {
    exhibition_id: raw.exhibition_id,
    museum_id: raw.museum_id,
    exhibition_name: raw.exhibition_name,
    cover_image_url: raw.cover_image_url || '',
    official_url: raw.official_url || '',
    short_description: raw.short_description || '',
    start_date: startDate,
    end_date: endDate,
    status: raw.status as ExhibitionStatus,
    date_label: computeDateLabel(startDate, endDate),
    related_artwork_ids: parseRelatedArtworks(raw.related_artworks),
    museum_name: raw.museum_name || 'Unknown Museum',
    city: raw.city || '',
    state: raw.state || '',
  };
}

export function useExhibitionsPage(params: ExhibitionPageParams) {
  return useQuery({
    queryKey: ['exhibitions-page', params],
    queryFn: async (): Promise<ExhibitionPageResult> => {
      const { data, error } = await supabase.rpc('get_exhibitions_page', {
        p_page: params.page,
        p_page_size: params.pageSize ?? 20,
        p_search: params.search || null,
        p_country: params.country || null,
        p_state: params.state || null,
        p_city: params.city || null,
        p_statuses: params.statuses && params.statuses.length > 0 ? params.statuses : null,
        p_closing_soon: params.closingSoon ?? false,
        p_date_from: params.dateFrom || null,
        p_date_to: params.dateTo || null,
      });
      if (error) throw error;
      const result = data as unknown as { total: number; page: number; page_size: number; data: RawExhibitionRow[] };
      return {
        total: result.total,
        page: result.page,
        page_size: result.page_size,
        data: (result.data || []).map(parseRow),
      };
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

/**
 * Fetch all exhibitions (for passport/lookup use cases).
 * Fetches from Supabase in paginated chunks.
 */
async function fetchAllExhibitions(): Promise<Exhibition[]> {
  const exhibitions: Exhibition[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('exhibitions')
      .select(`
        exhibition_id, museum_id, exhibition_name, cover_image_url,
        start_date, end_date, official_url, short_description, related_artworks,
        museums!inner(name, city, state, country, lat, lng)
      `)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data as any[]) {
      const museum = row.museums;
      const startDate = row.start_date ? new Date(row.start_date + 'T00:00:00') : null;
      const endDate = row.end_date ? new Date(row.end_date + 'T00:00:00') : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let status: ExhibitionStatus = 'TBD';
      if (startDate && endDate) {
        if (today < startDate) status = 'Upcoming';
        else if (today > endDate) status = 'Past';
        else status = 'Ongoing';
      } else if (startDate && !endDate) {
        status = today < startDate ? 'Upcoming' : 'Ongoing';
      } else if (!startDate && endDate) {
        status = today <= endDate ? 'Ongoing' : 'Past';
      }

      exhibitions.push({
        exhibition_id: row.exhibition_id,
        museum_id: row.museum_id,
        exhibition_name: row.exhibition_name,
        cover_image_url: row.cover_image_url || '',
        official_url: row.official_url || '',
        short_description: row.short_description || '',
        start_date: startDate,
        end_date: endDate,
        status,
        date_label: computeDateLabel(startDate, endDate),
        related_artwork_ids: parseRelatedArtworks(row.related_artworks),
        museum_name: museum?.name || 'Unknown Museum',
        city: museum?.city || '',
        state: museum?.state || '',
      });
    }

    if (data.length < pageSize) hasMore = false;
    else from += pageSize;
  }

  return exhibitions;
}

export function useExhibitions() {
  return useQuery({
    queryKey: ['exhibitions'],
    queryFn: fetchAllExhibitions,
    staleTime: 5 * 60 * 1000,
  });
}

export function useExhibition(exhibitionId: string | null) {
  return useQuery({
    queryKey: ['exhibition', exhibitionId],
    queryFn: async (): Promise<Exhibition | null> => {
      if (!exhibitionId) return null;
      const { data, error } = await supabase
        .from('exhibitions')
        .select(`
          exhibition_id, museum_id, exhibition_name, cover_image_url,
          start_date, end_date, official_url, short_description, related_artworks,
          museums!inner(name, city, state, country, lat, lng)
        `)
        .eq('exhibition_id', exhibitionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const row = data as any;
      const museum = row.museums;
      const startDate = row.start_date ? new Date(row.start_date + 'T00:00:00') : null;
      const endDate = row.end_date ? new Date(row.end_date + 'T00:00:00') : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let status: ExhibitionStatus = 'TBD';
      if (startDate && endDate) {
        if (today < startDate) status = 'Upcoming';
        else if (today > endDate) status = 'Past';
        else status = 'Ongoing';
      } else if (startDate && !endDate) {
        status = today < startDate ? 'Upcoming' : 'Ongoing';
      } else if (!startDate && endDate) {
        status = today <= endDate ? 'Ongoing' : 'Past';
      }

      return {
        exhibition_id: row.exhibition_id,
        museum_id: row.museum_id,
        exhibition_name: row.exhibition_name,
        cover_image_url: row.cover_image_url || '',
        official_url: row.official_url || '',
        short_description: row.short_description || '',
        start_date: startDate,
        end_date: endDate,
        status,
        date_label: computeDateLabel(startDate, endDate),
        related_artwork_ids: parseRelatedArtworks(row.related_artworks),
        museum_name: museum?.name || 'Unknown Museum',
        city: museum?.city || '',
        state: museum?.state || '',
      };
    },
    enabled: !!exhibitionId,
    staleTime: 5 * 60 * 1000,
  });
}
