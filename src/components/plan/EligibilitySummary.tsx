import { useState } from 'react';
import { Check, AlertCircle, Pencil, SkipForward, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePreferences } from '@/hooks/usePreferences';
import { DiscountsContent } from '@/components/settings/DiscountsCard';
import { getEligibilityDisplayLabel } from '@/types/eligibility';
import { ALL_CATALOG_ITEMS } from '@/lib/eligibilityCatalog';
import type { EligibilityItem } from '@/types/eligibility';

interface EligibilitySectionProps {
  eligibilities: EligibilityItem[];
  isLoading: boolean;
  onGenerate: () => void;
}

export function EligibilitySection({ eligibilities, isLoading, onGenerate }: EligibilitySectionProps) {
  const { preferences, updatePreferences } = usePreferences();
  const [eligDrawerOpen, setEligDrawerOpen] = useState(false);

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading eligibility…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold mb-1">Your Eligibility</h2>
        <p className="text-sm text-muted-foreground">
          We'll use your eligibility to find the best discounts and free admission days.
        </p>
      </div>

      {eligibilities.length > 0 ? (
        <div className="gallery-card space-y-3">
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">Your Profile</h3>
          <div className="flex flex-wrap gap-2">
            {eligibilities.map(item => {
              const catalogItem = ALL_CATALOG_ITEMS.find(c => c.type === item.type);
              return (
                <span key={item.type} className="museum-chip flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-accent" />
                  {catalogItem?.icon} {catalogItem?.label || item.type}
                </span>
              );
            })}
          </div>
          <Sheet open={eligDrawerOpen} onOpenChange={setEligDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="mt-2">
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit Eligibility
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Discounts & Eligibility</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <DiscountsContent preferences={preferences} onUpdate={updatePreferences} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        <div className="gallery-card text-center py-8">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-display font-semibold mb-1">No eligibility profile yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your passes and programs to get accurate pricing.
          </p>
          <Sheet open={eligDrawerOpen} onOpenChange={setEligDrawerOpen}>
            <SheetTrigger asChild>
              <Button>Set Eligibility</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Discounts & Eligibility</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <DiscountsContent preferences={preferences} onUpdate={updatePreferences} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onGenerate} className="flex-1">
          Generate Plan
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
        {eligibilities.length === 0 && (
          <Button variant="ghost" onClick={onGenerate} className="text-muted-foreground">
            <SkipForward className="w-4 h-4 mr-1" />
            Skip
          </Button>
        )}
      </div>
      {eligibilities.length === 0 && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          Prices may be less accurate without eligibility.
        </p>
      )}
    </div>
  );
}
