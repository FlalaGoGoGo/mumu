import { useState } from 'react';
import {
  MapPin, Clock, Footprints, ChevronDown, ChevronUp,
  DoorOpen, Frame, Coffee, ShoppingBag, Info, LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CitationChip } from './CitationChip';
import { AppliedPreferences } from './AppliedPreferences';
import type { RoutePlan, RouteStep, RouteStepType, FacilityKey, VisitIntake } from '@/types/museumDetail';

const STEP_ICONS: Record<RouteStepType, React.ReactNode> = {
  entrance: <DoorOpen className="w-4 h-4" />,
  gallery: <Frame className="w-4 h-4" />,
  exhibition: <Frame className="w-4 h-4" />,
  artwork: <Frame className="w-4 h-4" />,
  facility: <MapPin className="w-4 h-4" />,
  meal: <Coffee className="w-4 h-4" />,
  rest: <MapPin className="w-4 h-4" />,
  shop: <ShoppingBag className="w-4 h-4" />,
  exit: <LogOut className="w-4 h-4" />,
};

const FACILITY_ICONS: Record<FacilityKey, string> = {
  checkroom: '🧥', restroom: '🚻', family_restroom: '👪', infant_care: '🍼',
  elevator: '🛗', wheelchair: '♿', quiet_space: '🤫', cafe: '☕', shop: '🛍️',
};

interface IndoorRouteProps {
  route: RoutePlan;
  intake?: Partial<VisitIntake>;
  onReplan?: () => void;
}

export function IndoorRoute({ route, intake, onReplan }: IndoorRouteProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const gallerySteps = route.steps.filter(s => s.type === 'gallery');
  const essentialSteps = gallerySteps.filter(s => !s.subtitle?.includes('Optional'));
  const optionalSteps = gallerySteps.filter(s => s.subtitle?.includes('Optional'));

  return (
    <section className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg font-semibold">Your Visit Route</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            ~{route.totalDurationMinutes} min · {gallerySteps.length} stops
          </Badge>
          {onReplan && (
            <button onClick={onReplan} className="text-xs text-primary hover:underline">
              Change preferences
            </button>
          )}
        </div>
      </div>

      {/* Applied preferences */}
      {intake && <AppliedPreferences intake={intake} />}

      <p className="text-sm text-muted-foreground">{route.summary}</p>

      {/* Rationale */}
      {route.rationale.length > 0 && (
        <div className="bg-secondary/30 rounded-lg p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> Why this route
          </p>
          <ul className="space-y-1">
            {route.rationale.map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Route legend */}
      {optionalSteps.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {essentialSteps.length} essential stop{essentialSteps.length !== 1 ? 's' : ''} + {optionalSteps.length} optional
        </p>
      )}

      {/* Steps timeline */}
      <div className="relative">
        {route.steps.map((step, idx) => {
          const isExpanded = expandedStep === step.stepId;
          const isLast = idx === route.steps.length - 1;
          const isOptional = step.subtitle?.includes('Optional');

          return (
            <div key={step.stepId} className="relative flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border',
                  step.type === 'entrance' ? 'bg-primary text-primary-foreground border-primary' :
                  step.type === 'exit' ? 'bg-muted text-muted-foreground border-border' :
                  step.type === 'meal' ? 'bg-accent/20 text-accent border-accent/30' :
                  isOptional ? 'bg-card text-muted-foreground border-dashed border-border' :
                  'bg-card text-foreground border-border'
                )}>
                  {STEP_ICONS[step.type]}
                </div>
                {!isLast && (
                  <div className={cn('w-px flex-1 min-h-[24px]', isOptional ? 'border-l border-dashed border-border' : 'bg-border')} />
                )}
              </div>

              {/* Content */}
              <div className={cn('pb-5 flex-1 min-w-0', isLast && 'pb-0')}>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.stepId)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn(
                        'text-sm font-medium group-hover:text-primary transition-colors truncate',
                        isOptional && 'text-muted-foreground'
                      )}>
                        {isOptional && <span className="text-xs mr-1">○</span>}
                        {step.title}
                      </p>
                      {step.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {step.durationMinutes}m
                      </span>
                      {step.walkMinutesFromPrevious > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
                          <Footprints className="w-3 h-3" />
                          {step.walkMinutesFromPrevious}m
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {step.location.label}
                      {step.location.floor && ` · Floor ${step.location.floor}`}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-muted-foreground italic">
                      "{step.whyThisStop}"
                    </p>

                    {step.primaryObjects.length > 0 && (
                      <div className="grid gap-2">
                        {step.primaryObjects.map(art => (
                          <div key={art.id} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border">
                            {art.imageUrl ? (
                              <img
                                src={art.imageUrl}
                                alt={art.title}
                                className="w-12 h-12 rounded object-cover flex-shrink-0 bg-muted"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                <Frame className="w-5 h-5 text-muted-foreground/30" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{art.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {art.artistTitle}{art.year ? `, ${art.year}` : ''}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {art.mustSee && (
                                  <Badge variant="outline" className="text-[0.6rem] px-1 py-0 h-4">Must-see</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {step.nearbyFacilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {step.nearbyFacilities.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-secondary/50 px-2 py-0.5 rounded-full text-muted-foreground">
                            {FACILITY_ICONS[f.key]} {f.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {step.replanHints.length > 0 && (
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-2.5">
                        <p className="text-xs font-medium text-accent-foreground/70 mb-1">If plans change:</p>
                        {step.replanHints.map((h, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {h}</p>
                        ))}
                      </div>
                    )}

                    {step.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {step.citations.map(c => (
                          <CitationChip key={c.id} citation={c} compact />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Route citations */}
      {route.citations.length > 0 && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1.5">Sources</p>
          <div className="flex flex-wrap gap-1.5">
            {route.citations.map(c => (
              <CitationChip key={c.id} citation={c} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
