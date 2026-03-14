import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Info, ExternalLink, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { MuseumConfig } from '@/config/museumConfig';
import {
  computeDiscountRows,
  getMemberNote,
  TICKET_CATEGORIES,
  getBasePriceFromAdmission,
  inferTicketCategory,
  getInferredCategoryLabel,
  getAgeFromDOB,
  type DiscountRow,
} from '@/lib/aicDiscountRules';

interface DiscountCalculatorProps {
  config: MuseumConfig;
}

export function DiscountCalculator({ config }: DiscountCalculatorProps) {
  const navigate = useNavigate();
  const { preferences, isLoading } = usePreferences();
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);
  const [manualCategory, setManualCategory] = useState<string | null>(null);

  const eligibilities = useMemo(
    () => deserializeEligibilities(preferences.discounts || []),
    [preferences.discounts],
  );

  const hasAnyEligibility = eligibilities.length > 0;

  // Auto-infer ticket category from profile data
  const inferredCategory = useMemo(
    () => inferTicketCategory(eligibilities),
    [eligibilities],
  );

  const activeCategory = manualCategory || inferredCategory;

  const basePrice = useMemo(
    () => getBasePriceFromAdmission(config.admission, activeCategory),
    [config.admission, activeCategory],
  );

  const discountRows = useMemo(
    () =>
      computeDiscountRows({
        eligibilities,
        basePrice,
        ticketCategory: activeCategory,
        now: new Date(),
        hours: config.hours,
      }),
    [eligibilities, basePrice, activeCategory, config.hours],
  );

  const memberNote = useMemo(
    () => getMemberNote(eligibilities),
    [eligibilities],
  );

  // Group rows
  const availableNow = discountRows.filter(r => r.qualifies && r.applicableNow);
  const eligibleLater = discountRows.filter(r => r.qualifies && !r.applicableNow);
  const notEligible = discountRows.filter(r => !r.qualifies);

  // Best price = minimum from rows that are actually applicable RIGHT NOW
  const bestPriceNow = availableNow.length > 0
    ? Math.min(...availableNow.map(r => r.yourPrice))
    : basePrice;

  const hasSavingsNow = availableNow.length > 0 && bestPriceNow < basePrice;

  // Build inference explanation
  const inferenceReason = useMemo(() => {
    const age = getAgeFromDOB(eligibilities);
    if (activeCategory === 'child' && age !== null) return `Age ${age} (from your profile)`;
    if (activeCategory === 'teen' && age !== null) return `Age ${age} (from your profile)`;
    if (activeCategory === 'senior' && age !== null) return `Age ${age} (from your profile)`;
    if (activeCategory === 'student') return 'Student ID on file';
    return null;
  }, [eligibilities, activeCategory]);

  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-4">
      {/* Header */}
      <h3 className="font-display font-semibold flex items-center gap-2">
        <Calculator className="w-4 h-4" />
        Discount Calculator
      </h3>

      {/* ── Best Price Hero ── */}
      <div className={cn(
        'p-4 rounded-lg border text-center',
        hasSavingsNow
          ? 'bg-accent/10 border-accent/30'
          : 'bg-muted/40 border-border',
      )}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Your best price today
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <span className={cn(
            'text-3xl font-bold tabular-nums font-display',
            bestPriceNow === 0 ? 'text-accent-foreground' : 'text-foreground',
          )}>
            {bestPriceNow === 0 ? 'Free' : `$${bestPriceNow}`}
          </span>
          {hasSavingsNow && bestPriceNow > 0 && (
            <span className="text-sm text-muted-foreground line-through">${basePrice}</span>
          )}
        </div>
        {availableNow.length > 0 ? (
          <p className="text-xs text-muted-foreground mt-1.5">
            via {availableNow[0].name}
            {availableNow.length > 1 && ` (+${availableNow.length - 1} more)`}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1.5">
            {eligibleLater.length > 0
              ? 'No discounts active right now — see eligible options below'
              : 'Standard admission price'}
          </p>
        )}
      </div>

      {/* ── Inferred category chip ── */}
      {!manualCategory && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Ticket: <span className="font-medium text-foreground">{getInferredCategoryLabel(inferredCategory)}</span>
            {' · '}Base ${basePrice}
          </span>
          {inferenceReason && (
            <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0 h-4 font-normal">
              {inferenceReason}
            </Badge>
          )}
        </div>
      )}

      {/* ── Your Eligibility chips ── */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Your Eligibility
        </p>
        {hasAnyEligibility ? (
          <div className="flex flex-wrap gap-1.5">
            {eligibilities.slice(0, 6).map((item, i) => {
              const catalogItem = ALL_CATALOG_ITEMS.find(c => c.type === item.type);
              return (
                <Badge key={i} variant="secondary" className="text-xs font-normal">
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
            <p className="text-sm text-muted-foreground">No eligibility set.</p>
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

      {/* ── Available Now ── */}
      {availableNow.length > 0 && (
        <DiscountGroup
          title="Available Now"
          variant="valid"
          rows={availableNow}
        />
      )}

      {/* ── Eligible Later ── */}
      {eligibleLater.length > 0 && (
        <DiscountGroup
          title="Eligible Later"
          variant="later"
          rows={eligibleLater}
        />
      )}

      {/* ── Not Eligible (collapsed) ── */}
      {notEligible.length > 0 && (
        <DiscountGroup
          title="Not Eligible"
          variant="inactive"
          rows={notEligible}
          collapsible
        />
      )}

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

      {/* ── Manual override toggle ── */}
      <div className="border-t border-border pt-3">
        <button
          onClick={() => setManualOverrideOpen(!manualOverrideOpen)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Checking for someone else?</span>
          {manualOverrideOpen ? (
            <ChevronUp className="w-3.5 h-3.5 ml-auto" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 ml-auto" />
          )}
        </button>

        {manualOverrideOpen && (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              Ticket type:
            </label>
            <Select
              value={manualCategory || ''}
              onValueChange={(v) => setManualCategory(v || null)}
            >
              <SelectTrigger className="w-[160px] h-8 text-sm">
                <SelectValue placeholder="Use my profile" />
              </SelectTrigger>
              <SelectContent>
                {TICKET_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {manualCategory && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setManualCategory(null)}
              >
                Reset
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Discount Group ─────────────────────────────────────────────────────────────

function DiscountGroup({
  title,
  variant,
  rows,
  collapsible = false,
}: {
  title: string;
  variant: 'valid' | 'later' | 'inactive';
  rows: DiscountRow[];
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);

  const headerColor = {
    valid: 'text-accent-foreground',
    later: 'text-foreground',
    inactive: 'text-muted-foreground',
  }[variant];

  return (
    <div>
      <button
        onClick={collapsible ? () => setOpen(!open) : undefined}
        className={cn(
          'flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2 w-full',
          headerColor,
          collapsible && 'cursor-pointer hover:opacity-80',
        )}
      >
        <span>{title}</span>
        <span className="text-muted-foreground font-normal">({rows.length})</span>
        {collapsible && (
          open
            ? <ChevronUp className="w-3 h-3 ml-auto" />
            : <ChevronDown className="w-3 h-3 ml-auto" />
        )}
      </button>
      {open && (
        <div className="divide-y divide-border">
          {rows.map(row => (
            <DiscountRowItem key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Individual discount row ────────────────────────────────────────────────────

const statusColors: Record<DiscountRow['statusVariant'], string> = {
  valid: 'bg-accent/20 text-accent-foreground border-accent/30',
  inactive: 'bg-muted text-muted-foreground',
  seasonal: 'bg-accent/10 text-accent-foreground border-accent/20',
  info: 'bg-secondary text-secondary-foreground',
};

function DiscountRowItem({ row }: { row: DiscountRow }) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5 flex-shrink-0">{row.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">{row.name}</span>
          </div>
          {row.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>
          )}
          {row.note && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">{row.note}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              row.qualifies && row.yourPrice === 0 ? 'text-accent-foreground' : 'text-foreground',
            )}
          >
            {row.qualifies ? (row.yourPrice === 0 ? 'Free' : `$${row.yourPrice}`) : '—'}
          </span>
          <Badge
            variant="secondary"
            className={cn('text-[0.65rem] px-1.5 py-0 h-5', statusColors[row.statusVariant])}
          >
            {row.statusLabel}
          </Badge>
        </div>
      </div>
      {row.nextEligible && row.qualifies && (
        <p className="text-xs text-muted-foreground mt-1 ml-7">
          Next: <span className="font-medium">{row.nextEligible}</span>
        </p>
      )}
    </div>
  );
}
