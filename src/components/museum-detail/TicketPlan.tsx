import { ExternalLink, Info, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CitationChip } from './CitationChip';
import type { TicketRecommendation } from '@/types/museumDetail';

interface TicketPlanProps {
  ticket: TicketRecommendation;
}

export function TicketPlan({ ticket }: TicketPlanProps) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Ticket className="w-4 h-4 text-accent" />
        <h2 className="font-display text-lg font-semibold">Best Ticket Plan</h2>
        <Badge variant="outline" className="text-xs ml-auto">
          MuMu recommendation
        </Badge>
      </div>

      <p className="text-sm font-medium text-foreground">
        {ticket.recommendationLabel}
      </p>
      <p className="text-sm text-muted-foreground">
        {ticket.recommendationSummary}
      </p>

      {ticket.eligibilitySummary && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          {ticket.eligibilitySummary}
        </div>
      )}

      {/* Add-on exhibitions */}
      {ticket.addOnExhibitions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Optional add-on exhibitions
          </p>
          {ticket.addOnExhibitions.map(ex => (
            <div key={ex.id} className="p-3 border border-border rounded-lg bg-background">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{ex.title}</p>
                {ex.requiresAddOnTicket && (
                  <Badge variant="secondary" className="text-[0.65rem]">Extra ticket</Badge>
                )}
              </div>
              {ex.shortDescription && (
                <p className="text-xs text-muted-foreground mt-1">{ex.shortDescription}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {ticket.notes.length > 0 && (
        <ul className="space-y-1">
          {ticket.notes.map((n, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-accent mt-0.5">●</span> {n}
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <Button asChild className="w-full gap-2" size="lg">
        <a href={ticket.officialPurchaseUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4" />
          Buy Tickets on Official Site
        </a>
      </Button>

      {/* Citations */}
      {ticket.citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ticket.citations.map(c => (
            <CitationChip key={c.id} citation={c} />
          ))}
        </div>
      )}
    </section>
  );
}
