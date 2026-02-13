import { useQuery } from '@tanstack/react-query';
import type { TicketRuleEntry } from '@/lib/plannerUtils';

export function useTicketRules() {
  return useQuery({
    queryKey: ['ticket-rules'],
    queryFn: async (): Promise<Record<string, TicketRuleEntry>> => {
      const response = await fetch('/data/ticket_rules.json');
      return response.json();
    },
    staleTime: Infinity,
  });
}
