import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AicHighlight } from '@/types/museum';

export function useAicHighlights() {
  return useQuery({
    queryKey: ['aic-highlights'],
    queryFn: async (): Promise<AicHighlight[]> => {
      const { data, error } = await supabase
        .from('aic_highlights')
        .select('*')
        .order('route_1h_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRouteHighlights() {
  return useQuery({
    queryKey: ['route-highlights'],
    queryFn: async (): Promise<AicHighlight[]> => {
      const { data, error } = await supabase
        .from('aic_highlights')
        .select('*')
        .not('route_1h_order', 'is', null)
        .order('route_1h_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}
