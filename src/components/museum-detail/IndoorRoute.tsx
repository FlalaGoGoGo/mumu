import { useState } from 'react';
import {
  MapPin, Clock, Footprints, ChevronDown, ChevronUp,
  DoorOpen, Frame, Coffee, ShoppingBag, Info, LogOut,
  Eye, SkipForward, Bookmark, RotateCcw, MessageCircle,
  Star, Sparkles, ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CitationChip } from './CitationChip';
import { AppliedPreferences } from './AppliedPreferences';
import { useVisitProgress, type StepStatus } from './VisitProgressContext';
import type { RoutePlan, RouteStep, RouteStepType, FacilityKey, VisitIntake, ArtworkRef } from '@/types/museumDetail';
import mumuLogo from '@/assets/mumu-logo.png';

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
  onArtworkClick?: (artwork: ArtworkRef) => void;
  onAskMuMu?: (question?: string) => void;
}

function ArtworkMini({ art, label, onArtworkClick }: { art: ArtworkRef; label?: string; onArtworkClick?: (a: ArtworkRef) => void }) {
  return (
    <button
      onClick={() => onArtworkClick?.(art)}
      className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors text-left w-full"
    >
      {art.imageUrl ? (
        <img
          src={art.imageUrl}
          alt={art.title}
          className="w-12 h-12 rounded object-cover flex-shrink-0 bg-muted"
          onError={(e) => { (e.target as HTMLImageElement).src = mumuLogo; (e.target as HTMLImageElement).className = 'w-12 h-12 rounded object-contain flex-shrink-0 bg-muted p-2 opacity-30'; }}
        />
      ) : (
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
          <img src={mumuLogo} alt="" className="w-6 h-6 opacity-20" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {label && (
            <Badge variant={label === 'Anchor' ? 'default' : 'secondary'} className="text-[0.6rem] px-1.5 py-0 h-4 flex-shrink-0">
              {label === 'Anchor' && <Star className="w-2.5 h-2.5 mr-0.5" />}
              {label === 'Bonus' && <Sparkles className="w-2.5 h-2.5 mr-0.5" />}
              {label}
            </Badge>
          )}
          <p className="text-sm font-medium truncate">{art.title}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {art.artistTitle}{art.year ? `, ${art.year}` : ''}
        </p>
        {art.shortDescription && (
          <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2">{art.shortDescription}</p>
        )}
      </div>
    </button>
  );
}

function StepActionButtons({ step, status }: { step: RouteStep; status: StepStatus }) {
  const { markSeen, markSkipped, markSaved, resetStep } = useVisitProgress();
  if (step.type !== 'gallery') return null;

  if (status === 'seen') {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1"><Eye className="w-3 h-3" /> Seen</Badge>
        <button onClick={() => resetStep(step.stepId)} className="text-xs text-muted-foreground hover:text-foreground">Undo</button>
      </div>
    );
  }
  if (status === 'skipped') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs gap-1 text-muted-foreground"><SkipForward className="w-3 h-3" /> Skipped</Badge>
        <button onClick={() => resetStep(step.stepId)} className="text-xs text-primary hover:underline flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Add back</button>
      </div>
    );
  }
  if (status === 'saved') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs gap-1 text-accent"><Bookmark className="w-3 h-3" /> Saved for later</Badge>
        <button onClick={() => resetStep(step.stepId)} className="text-xs text-muted-foreground hover:text-foreground">Undo</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={() => markSeen(step.stepId)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-border bg-background hover:bg-primary/5 hover:border-primary/30 text-foreground transition-colors">
        <Eye className="w-3 h-3" /> Mark as Seen
      </button>
      <button onClick={() => markSkipped(step.stepId)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-border bg-background hover:bg-secondary text-muted-foreground transition-colors">
        <SkipForward className="w-3 h-3" /> Skip
      </button>
      <button onClick={() => markSaved(step.stepId)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-border bg-background hover:bg-accent/10 text-muted-foreground transition-colors">
        <Bookmark className="w-3 h-3" /> Save
      </button>
    </div>
  );
}

export function IndoorRoute({ route, intake, onReplan, onArtworkClick, onAskMuMu }: IndoorRouteProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const { stepStatuses, isTimeConstrained } = useVisitProgress();

  const gallerySteps = route.steps.filter(s => s.type === 'gallery');
  const essentialSteps = gallerySteps.filter(s => !s.isOptional);
  const optionalSteps = gallerySteps.filter(s => s.isOptional);

  const visibleSteps = isTimeConstrained
    ? route.steps.filter(s => {
        if (s.type !== 'gallery') return true;
        const status = stepStatuses[s.stepId];
        if (s.isOptional && status === 'pending') return false;
        return true;
      })
    : route.steps;

  const totalArtworks = gallerySteps.reduce((sum, s) => {
    return sum + (s.anchorWork ? 1 : 0) + (s.nearbyWorks?.length || 0) + (s.bonusWorks?.length || 0);
  }, 0);

  return (
    <section className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Your Visit Route</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            ~{route.totalDurationMinutes} min
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {gallerySteps.length} galleries · ~{totalArtworks} works
          </Badge>
          {onReplan && (
            <button onClick={onReplan} className="text-xs text-primary hover:underline">Change preferences</button>
          )}
        </div>
      </div>

      {intake && <AppliedPreferences intake={intake} />}

      <p className="text-sm text-foreground/80">{route.summary}</p>

      {route.rationale.length > 0 && (
        <div className="bg-secondary/40 rounded-lg p-3">
          <p className="text-xs font-medium text-foreground/70 mb-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> Why this route
          </p>
          <ul className="space-y-1">
            {route.rationale.map((r, i) => (
              <li key={i} className="text-xs text-foreground/70">• {r}</li>
            ))}
          </ul>
        </div>
      )}

      {optionalSteps.length > 0 && (
        <p className="text-xs text-foreground/60">
          {essentialSteps.length} essential zone{essentialSteps.length !== 1 ? 's' : ''} + {optionalSteps.length} optional
        </p>
      )}

      {/* Steps timeline */}
      <div className="relative">
        {visibleSteps.map((step, idx) => {
          const isExpanded = expandedStep === step.stepId;
          const isLast = idx === visibleSteps.length - 1;
          const status = stepStatuses[step.stepId] || 'pending';
          const isDone = status === 'seen' || status === 'skipped';
          const isGallery = step.type === 'gallery';

          return (
            <div key={step.stepId} className={cn('relative flex gap-3', isDone && 'opacity-60')}>
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors',
                  status === 'seen' ? 'bg-primary/20 text-primary border-primary/30' :
                  status === 'skipped' ? 'bg-muted text-muted-foreground border-border' :
                  step.type === 'entrance' ? 'bg-primary text-primary-foreground border-primary' :
                  step.type === 'exit' ? 'bg-muted text-muted-foreground border-border' :
                  step.type === 'meal' ? 'bg-accent/20 text-accent border-accent/30' :
                  step.isOptional ? 'bg-card text-muted-foreground border-dashed border-border' :
                  'bg-card text-foreground border-border'
                )}>
                  {status === 'seen' ? <Eye className="w-4 h-4" /> : STEP_ICONS[step.type]}
                </div>
                {!isLast && (
                  <div className={cn('w-px flex-1 min-h-[24px]', step.isOptional ? 'border-l border-dashed border-border' : 'bg-border')} />
                )}
              </div>

              {/* Content */}
              <div className={cn('pb-5 flex-1 min-w-0', isLast && 'pb-0')}>
                {/* Transition hint between steps */}
                {step.transitionHint && idx > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                    <span className="italic">{step.transitionHint}</span>
                  </div>
                )}

                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.stepId)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'text-sm font-medium group-hover:text-primary transition-colors truncate',
                          step.isOptional && status === 'pending' && 'text-muted-foreground',
                          isDone && 'line-through'
                        )}>
                          {step.title}
                        </p>
                        {isGallery && step.subtitle?.startsWith('Must-see') && (
                          <Badge className="text-[0.6rem] px-1.5 py-0 h-4 flex-shrink-0 bg-primary/10 text-primary border-primary/20">Must-see</Badge>
                        )}
                        {step.isOptional && (
                          <Badge variant="outline" className="text-[0.6rem] px-1.5 py-0 h-4 flex-shrink-0 border-dashed">Optional</Badge>
                        )}
                      </div>
                      {step.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{step.durationMinutes}m
                      </span>
                      {step.walkMinutesFromPrevious > 0 && (
                        <span className="text-xs text-muted-foreground items-center gap-1 hidden sm:flex">
                          <Footprints className="w-3 h-3" />{step.walkMinutesFromPrevious}m walk
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {step.location.label}{step.location.floor && ` · Floor ${step.location.floor}`}
                      {step.location.zone && ` · ${step.location.zone}`}
                    </span>
                  </div>

                  {/* Gallery summary when collapsed */}
                  {isGallery && !isExpanded && step.anchorWork && (
                    <div className="flex items-center gap-2 mt-2">
                      {step.anchorWork.imageUrl && (
                        <img
                          src={step.anchorWork.imageUrl}
                          alt={step.anchorWork.title}
                          className="w-8 h-8 rounded object-cover flex-shrink-0 bg-muted"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <span className="text-xs text-foreground/70 truncate">
                        <span className="font-medium">{step.anchorWork.title}</span>
                        {(step.nearbyWorks?.length || 0) > 0 && ` + ${step.nearbyWorks!.length} nearby`}
                        {(step.bonusWorks?.length || 0) > 0 && ` + ${step.bonusWorks!.length} bonus`}
                      </span>
                    </div>
                  )}
                </button>

                {isGallery && (
                  <div className="mt-2">
                    <StepActionButtons step={step} status={status} />
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Cluster rationale */}
                    {step.clusterRationale && (
                      <p className="text-xs text-foreground/70 italic border-l-2 border-primary/30 pl-2">
                        {step.clusterRationale}
                      </p>
                    )}

                    {/* Anchor work */}
                    {step.anchorWork && (
                      <div>
                        <p className="text-xs font-medium text-foreground/70 mb-1.5 flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary" /> Main attraction
                        </p>
                        <ArtworkMini art={step.anchorWork} label="Anchor" onArtworkClick={onArtworkClick} />
                      </div>
                    )}

                    {/* Nearby works */}
                    {step.nearbyWorks && step.nearbyWorks.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-foreground/70 mb-1.5">
                          While you're here — {step.nearbyWorks.length} nearby work{step.nearbyWorks.length > 1 ? 's' : ''}
                        </p>
                        <div className="grid gap-1.5">
                          {step.nearbyWorks.map(art => (
                            <ArtworkMini key={art.id} art={art} onArtworkClick={onArtworkClick} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bonus works */}
                    {step.bonusWorks && step.bonusWorks.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-foreground/70 mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-accent" /> Extra time? Also see
                        </p>
                        <div className="grid gap-1.5">
                          {step.bonusWorks.map(art => (
                            <ArtworkMini key={art.id} art={art} label="Bonus" onArtworkClick={onArtworkClick} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-gallery steps fallback */}
                    {!isGallery && step.primaryObjects.length > 0 && (
                      <div className="grid gap-2">
                        {step.primaryObjects.map(art => (
                          <ArtworkMini key={art.id} art={art} onArtworkClick={onArtworkClick} />
                        ))}
                      </div>
                    )}

                    {step.whyThisStop && !step.clusterRationale && (
                      <p className="text-xs text-foreground/60 italic">"{step.whyThisStop}"</p>
                    )}

                    {step.nearbyFacilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {step.nearbyFacilities.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-secondary/50 px-2 py-0.5 rounded-full text-foreground/70">
                            {FACILITY_ICONS[f.key]} {f.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {onAskMuMu && isGallery && (
                      <button
                        onClick={() => onAskMuMu(`Tell me about what's in Gallery ${step.location.galleryNumber}`)}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <MessageCircle className="w-3 h-3" /> Ask MuMu about this gallery
                      </button>
                    )}

                    {step.replanHints.length > 0 && (
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-2.5">
                        <p className="text-xs font-medium text-foreground/70 mb-1">If plans change:</p>
                        {step.replanHints.map((h, i) => (
                          <p key={i} className="text-xs text-foreground/60">• {h}</p>
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
