import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ExternalLink, Ticket, Info, BadgePercent, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePreferences } from '@/hooks/usePreferences';
import { deserializeEligibilities, getEligibilityDisplayLabel } from '@/types/eligibility';
import { ALL_CATALOG_ITEMS } from '@/lib/eligibilityCatalog';
import type { MuseumConfig } from '@/config/museumConfig';

interface TicketsDiscountsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: MuseumConfig;
}

export function TicketsDiscountsDrawer({
  open,
  onOpenChange,
  config,
}: TicketsDiscountsDrawerProps) {
  const navigate = useNavigate();
  const { preferences } = usePreferences();

  // Deserialize eligibility objects (not legacy string codes)
  const eligibilities = useMemo(
    () => deserializeEligibilities(preferences.discounts || []),
    [preferences.discounts],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Tickets & Discounts</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Buy Tickets CTA */}
          <Button className="w-full h-12 text-base" asChild>
            <a href={config.ticketsUrl} target="_blank" rel="noopener noreferrer">
              <Ticket className="w-5 h-5 mr-2" />
              Buy Tickets
              <ExternalLink className="w-4 h-4 ml-auto" />
            </a>
          </Button>

          {/* Admission Prices */}
          <div>
            <h3 className="font-display font-semibold mb-3">Admission Prices</h3>
            <div className="space-y-2">
              {config.admission.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                >
                  <span className="text-sm">{item.category}</span>
                  <span className="font-medium">{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Free Admission Callout */}
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">Free Admission</h4>
                <p className="text-sm text-muted-foreground">{config.freeAdmissionNote}</p>
              </div>
            </div>
          </div>

          {/* Member Note */}
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">{config.memberNote}</p>
          </div>

          {/* User's Eligibility */}
          {eligibilities.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BadgePercent className="w-4 h-4 text-accent" />
                <h3 className="font-display font-semibold">Your Eligibility</h3>
              </div>
              <div className="space-y-2">
                {eligibilities.map((item, i) => {
                  const catalogItem = ALL_CATALOG_ITEMS.find(c => c.type === item.type);
                  if (!catalogItem) return null;

                  return (
                    <div
                      key={`${item.type}-${i}`}
                      className="p-3 bg-accent/5 border border-accent/20 rounded-md"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{catalogItem.icon}</span>
                        <span className="font-medium text-sm">{catalogItem.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getEligibilityDisplayLabel(item, ALL_CATALOG_ITEMS)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/settings');
                }}
              >
                <Settings className="w-3 h-3 mr-1" />
                Edit Eligibility
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Set up your discount eligibility in Settings to see personalized savings.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  navigate('/settings');
                }}
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Go to Settings
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
