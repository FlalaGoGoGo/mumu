import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from './useSession';
import { toast } from '@/hooks/use-toast';
import { getSessionClient } from '@/lib/supabaseSession';

export type EventType = 'visit_museum' | 'see_artwork' | 'attend_exhibition' | 'wishlist_add' | 'wishlist_complete';
export type ItemType = 'museum' | 'exhibition' | 'artwork';

export interface UserEvent {
  event_id: string;
  session_id: string;
  event_type: EventType;
  item_type: ItemType;
  item_id: string;
  event_date: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export function useUserEvents(eventType?: EventType) {
  const sessionId = useSession();

  return useQuery({
    queryKey: ['user-events', sessionId, eventType],
    queryFn: async (): Promise<UserEvent[]> => {
      if (!sessionId) return [];
      const supabase = getSessionClient(sessionId);
      let query = supabase
        .from('user_events')
        .select('*')
        .eq('session_id', sessionId);
      if (eventType) query = query.eq('event_type', eventType);
      query = query.order('event_date', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as UserEvent[];
    },
    enabled: !!sessionId,
  });
}

export function useAddEvent() {
  const queryClient = useQueryClient();
  const sessionId = useSession();

  return useMutation({
    mutationFn: async (params: {
      event_type: EventType;
      item_type: ItemType;
      item_id: string;
      meta?: Record<string, unknown>;
    }) => {
      if (!sessionId) throw new Error('No session');
      const supabase = getSessionClient(sessionId);
      const { error } = await supabase.from('user_events').insert({
        session_id: sessionId,
        event_type: params.event_type,
        item_type: params.item_type,
        item_id: params.item_id,
        meta: (params.meta || {}) as any,
      });
      if (error) {
        // Duplicate event - ignore silently
        if (error.code === '23505') return;
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
    },
  });
}

export function useRemoveEvent() {
  const queryClient = useQueryClient();
  const sessionId = useSession();

  return useMutation({
    mutationFn: async (params: { event_type: EventType; item_id: string }) => {
      if (!sessionId) throw new Error('No session');
      const supabase = getSessionClient(sessionId);
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('session_id', sessionId)
        .eq('event_type', params.event_type)
        .eq('item_id', params.item_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
    },
  });
}

export function useCompleteWishlistItem() {
  const queryClient = useQueryClient();
  const sessionId = useSession();

  return useMutation({
    mutationFn: async (params: { item_type: ItemType; item_id: string }) => {
      if (!sessionId) throw new Error('No session');
      const supabase = getSessionClient(sessionId);
      // Insert completion event
      const { error } = await supabase.from('user_events').insert({
        session_id: sessionId,
        event_type: 'wishlist_complete' as string,
        item_type: params.item_type,
        item_id: params.item_id,
      } as any);
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast({
        title: '✦ Stamp added to your passport!',
        description: 'Wish list item completed!',
      });
    },
  });
}
