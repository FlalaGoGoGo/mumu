import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink, Landmark, Copy, Check, Navigation, MessageCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMuseumDetail } from '@/hooks/useMuseumDetail';
import { VisitSnapshot } from '@/components/museum-detail/VisitSnapshot';
import { VisitIntakeForm } from '@/components/museum-detail/VisitIntakeForm';
import { TicketPlan } from '@/components/museum-detail/TicketPlan';
import { IndoorRoute } from '@/components/museum-detail/IndoorRoute';
import { AskMuMuFab } from '@/components/museum-detail/AskMuMuFab';
import { MuseumKnowledge } from '@/components/museum-detail/MuseumKnowledge';
import { ArtworkDetailSheet } from '@/components/museum-detail/ArtworkDetailSheet';
import { VisitProgressProvider, useVisitProgress } from '@/components/museum-detail/VisitProgressContext';
import { VisitProgressBar } from '@/components/museum-detail/VisitProgressBar';
import { generateRoute } from '@/lib/routeEngine';
import type { VisitIntake, ArtworkRef, RoutePlan } from '@/types/museumDetail';

function MuseumDetailContent() {
  const { museum_id } = useParams<{ museum_id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useMuseumDetail(museum_id);

  const [isSticky, setIsSticky] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activePhase, setActivePhase] = useState<'before' | 'during'>('before');
  const [showTicketPlan, setShowTicketPlan] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [currentIntake, setCurrentIntake] = useState<Partial<VisitIntake> | null>(null);
  const [generatedRoute, setGeneratedRoute] = useState<RoutePlan | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkRef | null>(null);
  const [askMuMuOpen, setAskMuMuOpen] = useState(false);
  const [askMuMuInitialQuestion, setAskMuMuInitialQuestion] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const intakeRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const { initializeRoute } = useVisitProgress();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const handlePlanVisit = () => {
    intakeRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBuySmart = () => {
    setShowTicketPlan(true);
    setTimeout(() => ticketRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleIntakeSubmit = useCallback((intake: Partial<VisitIntake>) => {
    if (!data) return;
    setCurrentIntake(intake);
    const route = generateRoute(intake, data.artworks);
    setGeneratedRoute(route);
    initializeRoute(route.steps.filter(s => s.type === 'gallery').map(s => s.stepId));
    setShowTicketPlan(true);
    setShowRoute(true);
    setActivePhase('during');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  }, [data, initializeRoute]);

  const handleReplan = () => {
    setActivePhase('before');
    setTimeout(() => intakeRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleArtworkClick = (artwork: ArtworkRef) => {
    setSelectedArtwork(artwork);
  };

  const handleAskMuMu = (question?: string) => {
    if (question) setAskMuMuInitialQuestion(question);
    setAskMuMuOpen(true);
  };

  const handleAskMuMuFromArtwork = (question: string) => {
    handleAskMuMu(question);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Museum Not Found</h1>
        <p className="text-muted-foreground mb-6">
          {error || 'This museum does not have a detailed guide available yet.'}
        </p>
        <Button onClick={() => navigate('/')}>Back to Map</Button>
      </div>
    );
  }

  const { overview, artworks, exhibitions, ticketRecommendation, knowledge } = data;
  const address = overview.state
    ? `${overview.city}, ${overview.state}, ${overview.country}`
    : `${overview.city}, ${overview.country}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(overview.name + ' ' + address)}`;

  return (
    <div className="min-h-screen">
      {/* Sentinel for sticky header */}
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden />

      {/* Sticky Header */}
      <div
        className={cn(
          'sticky top-0 z-[1500] border-b border-border transition-all duration-200',
          'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
          isSticky && 'shadow-sm'
        )}
      >
        <div className="container max-w-4xl">
          <div className={cn(
            'flex items-center gap-3 sm:gap-4 transition-all duration-200',
            isSticky ? 'py-2.5' : 'py-4 sm:py-5'
          )}>
            <div className={cn(
              'flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center transition-all duration-200',
              isSticky ? 'h-10 w-10' : 'h-12 w-12 sm:h-14 sm:w-14'
            )}>
              {overview.heroImageUrl ? (
                <img src={overview.heroImageUrl} alt={overview.name} className="h-full w-full object-cover" />
              ) : (
                <Landmark className={cn('text-muted-foreground', isSticky ? 'h-5 w-5' : 'h-6 w-6 sm:h-7 sm:w-7')} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className={cn(
                'font-display font-bold text-foreground truncate transition-all duration-200',
                isSticky ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl md:text-3xl'
              )}>
                {overview.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{address}</p>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(address);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                        className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{copied ? 'Copied!' : 'Copy'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <TooltipProvider delayDuration={200}>
                {overview.officialSiteUrl && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a href={overview.officialSiteUrl} target="_blank" rel="noopener noreferrer"
                        className={cn(
                          'inline-flex items-center justify-center rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors',
                          isSticky ? 'h-8 w-8' : 'h-9 w-9'
                        )}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Official Site</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                      className={cn(
                        'inline-flex items-center justify-center rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors',
                        isSticky ? 'h-8 w-8' : 'h-9 w-9'
                      )}>
                      <Navigation className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Open in Maps</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="sticky top-[57px] sm:top-[65px] z-[1400] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container max-w-4xl">
          <div className="flex">
            <button
              onClick={() => setActivePhase('before')}
              className={cn(
                'flex-1 py-3 text-sm font-medium text-center transition-colors relative',
                activePhase === 'before'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Before Your Visit
              {activePhase === 'before' && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActivePhase('during')}
              className={cn(
                'flex-1 py-3 text-sm font-medium text-center transition-colors relative',
                activePhase === 'during'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
                !showRoute && 'opacity-50'
              )}
              disabled={!showRoute}
            >
              During Your Visit
              {activePhase === 'during' && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container max-w-4xl py-5 sm:py-6 space-y-6 sm:space-y-8 pb-24 sm:pb-8">
        {/* BEFORE YOUR VISIT */}
        {activePhase === 'before' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* 1. Visit Snapshot */}
            <VisitSnapshot
              overview={overview}
              onPlanVisit={handlePlanVisit}
              onBuySmart={handleBuySmart}
            />

            {/* 2. Buy Smart / Ticket Plan */}
            <div ref={ticketRef}>
              {showTicketPlan && ticketRecommendation && (
                <TicketPlan ticket={ticketRecommendation} exhibitions={exhibitions} />
              )}
            </div>

            {/* 3. Personalized Visit Intake */}
            <div ref={intakeRef}>
              <VisitIntakeForm
                museumId={overview.museumId}
                entrances={overview.visitSnapshot.entrances}
                onSubmit={handleIntakeSubmit}
              />
            </div>
          </div>
        )}

        {/* DURING YOUR VISIT */}
        {activePhase === 'during' && showRoute && generatedRoute && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* Visit Progress */}
            <VisitProgressBar totalSteps={generatedRoute.steps.filter(s => s.type === 'gallery').length} />

            {/* Route */}
            <IndoorRoute
              route={generatedRoute}
              intake={currentIntake || undefined}
              onReplan={handleReplan}
              onArtworkClick={handleArtworkClick}
              onAskMuMu={handleAskMuMu}
            />

            {/* Museum Knowledge */}
            <MuseumKnowledge
              overview={overview}
              knowledge={knowledge}
              artworks={artworks}
              exhibitions={exhibitions}
              onArtworkClick={handleArtworkClick}
            />
          </div>
        )}

        {/* Freshness footer */}
        {overview.freshness && (
          <div className="text-center py-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {overview.freshness.note}
              {overview.freshness.liveOpsAsOf && (
                <span> · Live operations as of {overview.freshness.liveOpsAsOf}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Floating Ask MuMu FAB */}
      <AskMuMuFab
        museumId={overview.museumId}
        open={askMuMuOpen}
        onOpenChange={setAskMuMuOpen}
        initialQuestion={askMuMuInitialQuestion}
        onInitialQuestionHandled={() => setAskMuMuInitialQuestion(null)}
      />

      {/* Artwork Detail Sheet */}
      <ArtworkDetailSheet
        artwork={selectedArtwork}
        open={!!selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        onAskMuMu={handleAskMuMuFromArtwork}
      />
    </div>
  );
}

export default function MuseumDetailPage() {
  return (
    <VisitProgressProvider>
      <MuseumDetailContent />
    </VisitProgressProvider>
  );
}
