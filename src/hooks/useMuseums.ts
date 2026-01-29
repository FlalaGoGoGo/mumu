import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Museum } from '@/types/museum';

export function useMuseums() {
  return useQuery({
    queryKey: ['museums'],
    queryFn: async (): Promise<Museum[]> => {
      const { data, error } = await supabase
        .from('museums')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useMuseum(museumId: string | null) {
  return useQuery({
    queryKey: ['museum', museumId],
    queryFn: async (): Promise<Museum | null> => {
      if (!museumId) return null;
      
      const { data, error } = await supabase
        .from('museums')
        .select('*')
        .eq('museum_id', museumId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!museumId,
  });
}
