import { Route, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MuseumQuickActionsProps {
  onPlanVisit: () => void;
  onTickets: () => void;
}

export function MuseumQuickActions({ onPlanVisit, onTickets }: MuseumQuickActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button onClick={onPlanVisit} className="flex-1 sm:flex-none">
        <Route className="w-4 h-4 mr-2" />
        Plan Your Visit
      </Button>
      <Button variant="outline" onClick={onTickets} className="flex-1 sm:flex-none">
        <Ticket className="w-4 h-4 mr-2" />
        Tickets & Discounts
      </Button>
    </div>
  );
}
