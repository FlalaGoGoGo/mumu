import { DollarSign, AlertCircle, Check, Info } from 'lucide-react';
import type { TicketPlanItem, ItineraryDay } from '@/lib/plannerUtils';

interface TicketPlanTabProps {
  ticketPlan: TicketPlanItem[];
  itinerary: ItineraryDay[];
}

export function TicketPlanTab({ ticketPlan, itinerary }: TicketPlanTabProps) {
  // Compute summary stats
  const totalBase = ticketPlan.reduce((sum, tp) => sum + (tp.basePrice ?? 0), 0);
  const totalEffective = ticketPlan.reduce((sum, tp) => sum + (tp.bestPrice.price ?? 0), 0);
  const totalSavings = ticketPlan.reduce((sum, tp) => sum + tp.bestPrice.savings, 0);
  const freeCount = ticketPlan.filter(tp => tp.bestPrice.price === 0).length;
  const discountCount = ticketPlan.filter(tp => tp.bestPrice.savings > 0 && tp.bestPrice.price !== 0).length;
  const unknownCount = ticketPlan.filter(tp => tp.bestPrice.price === null).length;
  const hasEnoughData = unknownCount < ticketPlan.length;

  const explanations: string[] = [];
  if (freeCount > 0) explanations.push(`Matched ${freeCount} free ${freeCount === 1 ? 'entry' : 'entries'} during your dates`);
  if (discountCount > 0) explanations.push(`Applied discounts at ${discountCount} ${discountCount === 1 ? 'museum' : 'museums'}`);
  if (unknownCount > 0) explanations.push(`${unknownCount} ${unknownCount === 1 ? 'museum' : 'museums'} with unknown pricing`);

  return (
    <div className="space-y-6 mt-4">
      {/* Summary Card */}
      <div className="gallery-card bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-accent" />
          <h3 className="font-display text-lg font-semibold">Cost Summary</h3>
        </div>
        
        {hasEnoughData ? (
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Estimated total</span>
              <span className="font-display text-2xl font-bold">${totalEffective.toFixed(0)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">You save</span>
                <span className="text-accent font-semibold">${totalSavings.toFixed(0)} vs standard tickets</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not enough pricing data to estimate total cost.</p>
        )}

        {explanations.length > 0 && (
          <div className="mt-4 space-y-1">
            {explanations.map((e, i) => (
              <p key={i} className="text-sm flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                {e}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Per museum breakdown */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">Per Museum</h3>
        {ticketPlan.map(tp => (
          <div key={tp.museum.museum_id} className="gallery-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-semibold text-base truncate">{tp.museum.name}</h4>
                {tp.rulesAvailable ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-baseline gap-2">
                      {tp.bestPrice.price === 0 ? (
                        <span className="museum-chip text-[10px] !bg-green-100 !text-green-800 !border-green-300">FREE</span>
                      ) : tp.bestPrice.price !== null ? (
                        <span className="font-semibold">{tp.currency === 'EUR' ? '€' : tp.currency === 'GBP' ? '£' : '$'}{tp.bestPrice.price.toFixed(0)}</span>
                      ) : null}
                      {tp.basePrice !== null && tp.bestPrice.savings > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          {tp.currency === 'EUR' ? '€' : tp.currency === 'GBP' ? '£' : '$'}{tp.basePrice.toFixed(0)}
                        </span>
                      )}
                    </div>
                    {tp.bestPrice.notes.length > 0 && (
                      <p className="text-xs text-accent">{tp.bestPrice.notes[0]}</p>
                    )}
                    {tp.pricingNotes && (
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        {tp.pricingNotes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Price unknown — ticket rules not available yet
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
