import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, ChevronDown, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/hooks/usePreferences';
import { deserializeEligibilities } from '@/types/eligibility';
import { ALL_CATALOG_ITEMS } from '@/lib/eligibilityCatalog';
import { getEligibilityDisplayLabel } from '@/types/eligibility';
import type { MuseumConfig } from '@/config/museumConfig';
import {
  computeDiscountRows,
  getMemberNote,
  TICKET_CATEGORIES,
  getBasePriceFromAdmission,
  type DiscountRow,
} from '@/lib/aicDiscountRules';

interface DiscountCalculatorProps {
  config: MuseumConfig;
}

export function DiscountCalculator({ config }: DiscountCalculatorProps) {
  const navigate = useNavigate();
  const { preferences, isLoading } = usePreferences();
  const [ticketCategory, setTicketCategory] = useState('adult');

  const eligibilities = useMemo(
    () => deserializeEligibilities(preferences.discounts || []),
    [preferences.discounts],
  );

  const basePrice = useMemo(
    () => getBasePriceFromAdmission(config.admission, ticketCategory),
    [config.admission, ticketCategory],
  );

  const discountRows = useMemo(
    () =>
      computeDiscountRows({
        eligibilities,
        basePrice,
        ticketCategory,
        now: new Date(),
        hours: config.hours,
      }),
    [eligibilities, basePrice, ticketCategory, config.hours],
  );

  const memberNote = useMemo(
    () => getMemberNote(eligibilities),
    [eligibilities],
  );

  const hasAnyEligibility = eligibilities.length > 0;
  const qualifiedRows = discountRows.filter(r => r.qualifies);

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-4">
      {/* Title */}
      <h3 className="font-display font-semibold flex items-center gap-2">
        <Calculator className="w-4 h-4" />
        Discount Calculator
      </h3>

      {/* Your Eligibility summary */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Your Eligibility
        </p>
        {hasAnyEligibility ? (
          <div className="flex flex-wrap gap-1.5">
            {eligibilities.slice(0, 6).map((item, i) => {
              const catalogItem = ALL_CATALOG_ITEMS.find(c => c.type === item.type);
              return (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {catalogItem?.icon} {catalogItem?.label || item.type}
                </Badge>
              );
            })}
            {eligibilities.length > 6 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{eligibilities.length - 6} more
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              No eligibility set.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => navigate('/settings')}
            >
              Complete Eligibility
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Ticket type selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          Ticket type:
        </label>
        <Select value={ticketCategory} onValueChange={setTicketCategory}>
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKET_CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm font-semibold ml-auto">
          Base: ${basePrice}
        </span>
      </div>

      {/* Discount rows */}
      <div className="divide-y divide-border">
        {discountRows.map(row => (
          <DiscountRowItem key={row.id} row={row} />
        ))}
      </div>

      {/* Member note */}
      <div
        className={cn(
          'p-3 rounded-md text-sm border',
          memberNote.isMember
            ? 'bg-accent/15 border-accent/30 text-foreground'
            : 'bg-muted/40 border-border text-muted-foreground',
        )}
      >
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{memberNote.text}</p>
        </div>
      </div>

      {/* Summary */}
      {qualifiedRows.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {qualifiedRows.length} discount{qualifiedRows.length > 1 ? 's' : ''} matched
            · Best price today:{' '}
            <span className="font-semibold text-foreground">
              ${Math.min(...qualifiedRows.map(r => r.yourPrice))}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Individual discount row ────────────────────────────────────────────────────

function DiscountRowItem({ row }: { row: DiscountRow }) {
  const statusColors: Record<DiscountRow['statusVariant'], string> = {
    valid: 'bg-accent/20 text-accent-foreground border-accent/30',
    inactive: 'bg-muted text-muted-foreground',
    seasonal: 'bg-accent/10 text-accent-foreground border-accent/20',
    info: 'bg-secondary text-secondary-foreground',
  };

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-2">
        {/* Icon + Eligibility indicator */}
        <span className="text-base mt-0.5 flex-shrink-0">{row.icon}</span>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">{row.name}</span>
            <span className="text-xs">{row.qualifies ? '✅' : '⚪'}</span>
          </div>
          {row.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>
          )}
          {row.note && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">{row.note}</p>
          )}
        </div>

        {/* Price + Status */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              row.qualifies && row.yourPrice === 0
                ? 'text-accent-foreground'
                : 'text-foreground',
            )}
          >
            {row.qualifies ? `$${row.yourPrice}` : '—'}
          </span>
          <Badge
            variant="secondary"
            className={cn('text-[0.65rem] px-1.5 py-0 h-5', statusColors[row.statusVariant])}
          >
            {row.statusLabel}
          </Badge>
        </div>
      </div>

      {/* Next eligible */}
      {row.nextEligible && row.qualifies && (
        <p className="text-xs text-muted-foreground mt-1.5 ml-7">
          Next eligible: <span className="font-medium">{row.nextEligible}</span>
        </p>
      )}
    </div>
  );
}
