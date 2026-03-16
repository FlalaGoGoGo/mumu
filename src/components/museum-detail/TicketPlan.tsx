import { useState } from 'react';
import { ExternalLink, Info, Ticket, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CitationChip } from './CitationChip';
import { cn } from '@/lib/utils';
import { useEligibility } from '@/hooks/useEligibility';
import type { TicketRecommendation, ExhibitionRef, Citation } from '@/types/museumDetail';

interface TicketPlanProps {
  ticket: TicketRecommendation;
  exhibitions: ExhibitionRef[];
}

export function TicketPlan({ ticket, exhibitions }: TicketPlanProps) {
  const { eligibilities } = useEligibility();
  const [wantSpecialExhibitions, setWantSpecialExhibitions] = useState(false);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);

  const ticketedExhibitions = exhibitions.filter(e => e.requiresAddOnTicket && e.status === 'current');
  const hasEligibilities = eligibilities.length > 0;

  // Determine day of week for the selected date
  const selectedDay = new Date(visitDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  const isTuesday = selectedDay === 'Tuesday';
  const isWeekend = selectedDay === 'Saturday' || selectedDay === 'Sunday';

  // Build personalized recommendation
  const hasStudentDiscount = eligibilities.some(e => e.type?.includes('student'));
  const hasSenior = eligibilities.some(e => e.type?.includes('senior') || e.type?.includes('age'));
  const hasMember = eligibilities.some(e => e.type?.includes('membership'));
  const hasBoa = eligibilities.some(e => e.type?.includes('bank_of_america') || e.label?.toLowerCase().includes('bank of america'));

  let recommendation = ticket.recommendationLabel;
  let summary = ticket.recommendationSummary;
  let eligibilityNote: string | null = null;

  if (hasMember) {
    eligibilityNote = 'As a member, you may have free admission. Members also get early access from 10–11 AM daily.';
  } else if (hasBoa && !isWeekend) {
    eligibilityNote = 'Bank of America cardholders get free admission on the first full weekend of each month through Museums on Us.';
  } else if (hasStudentDiscount) {
    eligibilityNote = 'Student discounts may apply — check the official ticket page for current student pricing.';
  } else if (hasSenior) {
    eligibilityNote = 'Senior discounts may apply — check the official ticket page for current senior pricing.';
  }

  if (isTuesday) {
    recommendation = 'The museum is closed on Tuesdays';
    summary = 'The Art Institute of Chicago is closed every Tuesday. Choose a different date for your visit.';
  }

  const dateAdvice = isWeekend
    ? 'Weekends tend to be busier. For a calmer visit, consider a weekday.'
    : isTuesday
    ? 'The museum is closed on Tuesdays.'
    : 'Weekdays are generally less crowded — good choice.';

  return (
    <section className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Ticket className="w-4 h-4 text-accent" />
        <h2 className="font-display text-lg font-semibold">Buy Smart</h2>
        <Badge variant="outline" className="text-xs ml-auto">
          MuMu recommendation
        </Badge>
      </div>

      {/* Visit date selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> When are you visiting?
        </label>
        <input
          type="date"
          value={visitDate}
          onChange={e => setVisitDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="bg-background border border-input rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">{dateAdvice}</p>
      </div>

      {/* Special exhibitions toggle */}
      {ticketedExhibitions.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Interested in special exhibitions?
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setWantSpecialExhibitions(false)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-colors',
                !wantSpecialExhibitions
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background hover:bg-secondary text-foreground'
              )}
            >
              General admission only
            </button>
            <button
              onClick={() => setWantSpecialExhibitions(true)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-colors',
                wantSpecialExhibitions
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background hover:bg-secondary text-foreground'
              )}
            >
              Include special exhibitions
            </button>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {!isTuesday && (
        <>
          <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {wantSpecialExhibitions
                ? 'General admission + special exhibition ticket'
                : recommendation
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {wantSpecialExhibitions
                ? 'General admission covers the museum and free exhibitions. Add a separate ticket for ticketed special exhibitions below.'
                : summary
              }
            </p>
          </div>

          {/* Eligibility note */}
          {eligibilityNote && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/10 border border-accent/20 p-3 rounded-lg">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-accent" />
              {eligibilityNote}
            </div>
          )}
          {!hasEligibilities && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Add your discount eligibility in Settings to get personalized ticket advice.
            </div>
          )}
        </>
      )}

      {/* Add-on exhibitions (only show if user wants them) */}
      {wantSpecialExhibitions && ticketedExhibitions.length > 0 && !isTuesday && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Ticketed special exhibitions
          </p>
          {ticketedExhibitions.map(ex => (
            <div key={ex.id} className="p-3 border border-border rounded-lg bg-background">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{ex.title}</p>
                <Badge variant="secondary" className="text-[0.65rem]">Extra ticket</Badge>
              </div>
              {ex.shortDescription && (
                <p className="text-xs text-muted-foreground mt-1">{ex.shortDescription}</p>
              )}
              {ex.officialUrl && (
                <a href={ex.officialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                  View details →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {!isTuesday && ticket.notes.filter(n => !n.includes('sample')).length > 0 && (
        <ul className="space-y-1">
          {ticket.notes.filter(n => !n.toLowerCase().includes('sample')).map((n, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-accent mt-0.5">●</span> {n}
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      {!isTuesday && (
        <Button asChild className="w-full gap-2" size="lg">
          <a href={ticket.officialPurchaseUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
            Buy Tickets on Official Site
          </a>
        </Button>
      )}

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
