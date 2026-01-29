import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './useSession';
import type { UserVisit, UserHighlightCompletion } from '@/types/museum';

export function useVisits() {
  const sessionId = useSession();
  
  return useQuery({
    queryKey: ['visits', sessionId],
    queryFn: async (): Promise<UserVisit[]> => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('user_visits')
        .select('*')
        .eq('session_id', sessionId)
        .order('visited_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
  });
}

export function useAddVisit() {
  const queryClient = useQueryClient();
  const sessionId = useSession();

  return useMutation({
    mutationFn: async (museumId: string) => {
      const { error } = await supabase
        .from('user_visits')
        .insert({ museum_id: museumId, session_id: sessionId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

export function useRemoveVisit() {
  const queryClient = useQueryClient();
  const sessionId = useSession();

  return useMutation({
    mutationFn: async (museumId: string) => {
      const { error } = await supabase
        .from('user_visits')
        .delete()
        .eq('museum_id', museumId)
        .eq('session_id', sessionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });
}

export function useHighlightCompletions() {
  const sessionId = useSession();
  
  return useQuery({
    queryKey: ['completions', sessionId],
    queryFn: async (): Promise<UserHighlightCompletion[]> => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('user_highlight_completions')
        .select('*')
        .eq('session_id', sessionId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId,
  });
}

export function useToggleHighlightCompletion() {
  const queryClient = useQueryClient();
  const sessionId = useSession();

  return useMutation({
    mutationFn: async ({ articId, isCompleted }: { articId: string; isCompleted: boolean }) => {
      if (isCompleted) {
        const { error } = await supabase
          .from('user_highlight_completions')
          .delete()
          .eq('artic_id', articId)
          .eq('session_id', sessionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_highlight_completions')
          .insert({ artic_id: articId, session_id: sessionId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
    },
  });
}
