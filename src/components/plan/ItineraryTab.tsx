import { format } from 'date-fns';
import { MapPin, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { ItineraryDay } from '@/lib/plannerUtils';

interface ItineraryTabProps {
  itinerary: ItineraryDay[];
}

function StatusBadge({ status }: { status: 'open' | 'closed' | 'unknown' }) {
  if (status === 'open') return <span className="museum-chip text-[10px] !bg-green-100 !text-green-800 !border-green-300">Open</span>;
  if (status === 'closed') return <span className="museum-chip text-[10px] !bg-red-100 !text-red-800 !border-red-300">Closed</span>;
  return <span className="museum-chip text-[10px]">Hours Unknown</span>;
}

function PriceBadge({ price, savings }: { price: number | null; savings: number }) {
  if (price === null) return <span className="text-xs text-muted-foreground">Price unknown</span>;
  if (price === 0) return <span className="museum-chip text-[10px] !bg-green-100 !text-green-800 !border-green-300">FREE</span>;
  return (
    <span className="text-sm font-semibold">
      ${price.toFixed(0)}
      {savings > 0 && <span className="text-xs text-accent ml-1">(save ${savings.toFixed(0)})</span>}
    </span>
  );
}

export function ItineraryTab({ itinerary }: ItineraryTabProps) {
  const navigate = useNavigate();

  if (itinerary.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No itinerary generated.</p>;
  }

  return (
    <div className="space-y-6 mt-4">
      {itinerary.map((day, dayIdx) => (
        <div key={dayIdx}>
          <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="route-step text-xs">{dayIdx + 1}</span>
            {format(day.date, 'EEEE, MMM d')}
          </h3>

          {day.museums.length === 0 ? (
            <div className="gallery-card">
              <p className="text-sm text-muted-foreground italic">No museums recommended for this day — rest day or all closed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {day.museums.map((im) => (
                <div key={im.museum.museum_id} className="gallery-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-display font-semibold text-base truncate">{im.museum.name}</h4>
                        <StatusBadge status={im.openStatus.status} />
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {im.museum.address || `${im.museum.city}, ${im.museum.country}`}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ~{im.suggestedDuration}h visit
                        </span>
                        <PriceBadge price={im.priceResult.price} savings={im.priceResult.savings} />
                      </div>
                      {im.priceResult.notes.length > 0 && (
                        <p className="text-xs text-accent mt-1">{im.priceResult.notes[0]}</p>
                      )}
                      {im.openStatus.note && (
                        <p className="text-xs text-muted-foreground mt-1">{im.openStatus.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/museum/${im.museum.museum_id}`)}
                    >
                      View Museum
                    </Button>
                    {im.museum.website_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={im.museum.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
