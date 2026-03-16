import { useState } from 'react';
import {
  MapPin, Clock, Footprints, ChevronDown, ChevronUp,
  DoorOpen, Frame, Coffee, ShoppingBag, Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CitationChip } from './CitationChip';
import type { RoutePlan, RouteStep, RouteStepType, FacilityKey } from '@/types/museumDetail';

const STEP_ICONS: Record<RouteStepType, React.ReactNode> = {
  entrance: <DoorOpen className="w-4 h-4" />,
  gallery: <Frame className="w-4 h-4" />,
  exhibition: <Frame className="w-4 h-4" />,
  artwork: <Frame className="w-4 h-4" />,
  facility: <MapPin className="w-4 h-4" />,
  meal: <Coffee className="w-4 h-4" />,
  rest: <MapPin className="w-4 h-4" />,
  shop: <ShoppingBag className="w-4 h-4" />,
  exit: <DoorOpen className="w-4 h-4" />,
};

const FACILITY_ICONS: Record<FacilityKey, string> = {
  checkroom: '🧥',
  restroom: '🚻',
  family_restroom: '👪',
  infant_care: '🍼',
  elevator: '🛗',
  wheelchair: '♿',
  quiet_space: '🤫',
  cafe: '☕',
  shop: '🛍️',
};

interface IndoorRouteProps {
  route: RoutePlan;
}

export function IndoorRoute({ route }: IndoorRouteProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg font-semibold">Today's Indoor Route</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {route.confidence === 'prototype' ? 'Prototype' : 'Live'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            ~{route.totalDurationMinutes} min
          </Badge>
        </div>
      </div>

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

      {/* Steps timeline */}
      <div className="relative">
        {route.steps.map((step, idx) => {
          const isExpanded = expandedStep === step.stepId;
          const isLast = idx === route.steps.length - 1;

          return (
            <div key={step.stepId} className="relative flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border',
                  step.type === 'entrance' ? 'bg-primary text-primary-foreground border-primary' :
                  step.type === 'meal' ? 'bg-accent/20 text-accent border-accent/30' :
                  'bg-card text-muted-foreground border-border'
                )}>
                  {STEP_ICONS[step.type]}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-border min-h-[24px]" />
                )}
              </div>

              {/* Content */}
              <div className={cn('pb-5 flex-1 min-w-0', isLast && 'pb-0')}>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.stepId)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {step.title}
                      </p>
                      {step.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {step.durationMinutes}m
                      </span>
                      {step.walkMinutesFromPrevious > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Footprints className="w-3 h-3" />
                          {step.walkMinutesFromPrevious}m walk
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Location label */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {step.location.label}
                      {step.location.floor && ` · Floor ${step.location.floor}`}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Why this stop */}
                    <p className="text-xs text-muted-foreground italic">
                      "{step.whyThisStop}"
                    </p>

                    {/* Primary artworks */}
                    {step.primaryObjects.length > 0 && (
                      <div className="grid gap-2">
                        {step.primaryObjects.map(art => (
                          <div key={art.id} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border">
                            {art.imageUrl && (
                              <img
                                src={art.imageUrl}
                                alt={art.title}
                                className="w-12 h-12 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{art.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {art.artistTitle}{art.year ? `, ${art.year}` : ''}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {art.isOnView && (
                                  <Badge variant="outline" className="text-[0.6rem] px-1 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">
                                    On view
                                  </Badge>
                                )}
                                {art.mustSee && (
                                  <Badge variant="outline" className="text-[0.6rem] px-1 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                                    Must-see
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Nearby facilities */}
                    {step.nearbyFacilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {step.nearbyFacilities.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-secondary/50 px-2 py-0.5 rounded-full text-muted-foreground">
                            {FACILITY_ICONS[f.key]} {f.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Replan hints */}
                    {step.replanHints.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">If plans change:</p>
                        {step.replanHints.map((h, i) => (
                          <p key={i} className="text-xs text-amber-700 dark:text-amber-400">• {h}</p>
                        ))}
                      </div>
                    )}

                    {/* Citations */}
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
