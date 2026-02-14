import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useVisitPlans } from '@/hooks/useVisitPlans';
import { ItineraryTab } from '@/components/plan/ItineraryTab';
import { TicketPlanTab } from '@/components/plan/TicketPlanTab';
import { VisitRouteMap } from '@/components/plan/VisitRouteMap';
import type { ItineraryDay } from '@/lib/plannerUtils';

export function VisitResults() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { getVisit } = useVisitPlans();

  const visit = visitId ? getVisit(visitId) : undefined;

  if (!visit || !visit.generatedAt || !visit.itinerary) {
    return (
      <div className="container max-w-3xl py-8 text-center">
        <p className="text-muted-foreground mb-4">No results found for this visit.</p>
        <Button onClick={() => navigate('/plan')}>Back to My Visits</Button>
      </div>
    );
  }

  // Parse itinerary dates back from ISO strings
  const itinerary: ItineraryDay[] = visit.itinerary.map((d: any) => ({
    ...d,
    date: new Date(d.date),
  }));

  const stopNames = visit.stops
    .map(s => s.city || s.state || s.country || s.region)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-73px)]">
      <div className="flex flex-col lg:flex-row">
        {/* Left: Itinerary + Tickets */}
        <div className="lg:w-1/2 lg:border-r border-border">
          <div className="container max-w-2xl py-6 lg:px-6">
            {/* Header */}
            <button onClick={() => navigate('/plan')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              My Visits
            </button>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {visit.name || 'Untitled Visit'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {stopNames && <span>{stopNames} • </span>}
                  {visit.mode === 'money' ? '💰 Save Money' : '⚡ Save Time'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recommended by MuMu rules
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/plan/${visitId}/edit`)} className="gap-1">
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            </div>

            <Tabs defaultValue="itinerary">
              <TabsList className="w-full">
                <TabsTrigger value="itinerary" className="flex-1">Itinerary</TabsTrigger>
                <TabsTrigger value="tickets" className="flex-1">Best Ticket Plan</TabsTrigger>
              </TabsList>
              <TabsContent value="itinerary">
                <ItineraryTab itinerary={itinerary} />
              </TabsContent>
              <TabsContent value="tickets">
                <TicketPlanTab ticketPlan={visit.ticketPlan} itinerary={itinerary} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right: Map */}
        <div className="lg:w-1/2 h-[400px] lg:h-[calc(100vh-73px)] lg:sticky lg:top-[73px]">
          <VisitRouteMap itinerary={itinerary} />
        </div>
      </div>
    </div>
  );
}
