import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink, Landmark, Copy, Check, Navigation } from 'lucide-react';
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
import { AskMuMuChat } from '@/components/museum-detail/AskMuMuChat';
import { MuseumKnowledge } from '@/components/museum-detail/MuseumKnowledge';
import type { VisitIntake } from '@/types/museumDetail';

export default function MuseumDetailPage() {
  const { museum_id } = useParams<{ museum_id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useMuseumDetail(museum_id);

  const [isSticky, setIsSticky] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTicketPlan, setShowTicketPlan] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Section refs for scroll-to
  const intakeRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Seed sample responses for Ask MuMu (loaded from seed)
  const [sampleResponses, setSampleResponses] = useState<any[]>([]);

  useEffect(() => {
    if (museum_id === 'art-institute-of-chicago-us') {
      fetch('/data/aic_seed.json')
        .then(r => r.json())
        .then(seed => setSampleResponses(seed.sampleAskMuMu || []))
        .catch(() => {});
    }
  }, [museum_id]);

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

  const handleIntakeSubmit = (_intake: Partial<VisitIntake>) => {
    setShowTicketPlan(true);
    setShowRoute(true);
    setTimeout(() => ticketRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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

  const { overview, artworks, exhibitions, ticketRecommendation, routePlan, knowledge } = data;
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
            'flex items-center gap-4 transition-all duration-200',
            isSticky ? 'py-2.5' : 'py-5'
          )}>
            {/* Hero image / logo */}
            <div className={cn(
              'flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center transition-all duration-200',
              isSticky ? 'h-10 w-10' : 'h-14 w-14'
            )}>
              {overview.heroImageUrl ? (
                <img src={overview.heroImageUrl} alt={overview.name} className="h-full w-full object-cover" />
              ) : (
                <Landmark className={cn('text-muted-foreground', isSticky ? 'h-5 w-5' : 'h-7 w-7')} />
              )}
            </div>

            {/* Name + address */}
            <div className="flex-1 min-w-0">
              <h1 className={cn(
                'font-display font-bold text-foreground truncate transition-all duration-200',
                isSticky ? 'text-lg' : 'text-2xl md:text-3xl'
              )}>
                {overview.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm text-muted-foreground truncate">{address}</p>
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

            {/* Quick links */}
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

      {/* Main content */}
      <div className="container max-w-4xl py-6 space-y-8">
        {/* 1. Visit Snapshot */}
        <VisitSnapshot
          overview={overview}
          onPlanVisit={handlePlanVisit}
          onBuySmart={handleBuySmart}
        />

        {/* 2. Personalized Visit Intake */}
        <div ref={intakeRef}>
          <VisitIntakeForm
            museumId={overview.museumId}
            entrances={overview.visitSnapshot.entrances}
            onSubmit={handleIntakeSubmit}
          />
        </div>

        {/* 3. Best Ticket Plan (shown after intake or Buy Smart) */}
        <div ref={ticketRef}>
          {showTicketPlan && ticketRecommendation && (
            <TicketPlan ticket={ticketRecommendation} />
          )}
        </div>

        {/* 4. Indoor Route (shown after intake submission) */}
        {showRoute && routePlan && (
          <IndoorRoute route={routePlan} />
        )}

        {/* 5. Ask MuMu */}
        <AskMuMuChat
          museumId={overview.museumId}
          sampleResponses={sampleResponses}
        />

        {/* 6. Museum Knowledge */}
        <MuseumKnowledge
          overview={overview}
          knowledge={knowledge}
          artworks={artworks}
          exhibitions={exhibitions}
        />

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
    </div>
  );
}
