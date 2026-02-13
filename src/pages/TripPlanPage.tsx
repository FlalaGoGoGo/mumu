import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { addDays, format, startOfDay } from 'date-fns';
import { CalendarRange, Zap, DollarSign, ChevronRight, MapPin, Clock, ExternalLink, Check, AlertCircle, Pencil, SkipForward, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useMuseums } from '@/hooks/useMuseums';
import { useTicketRules } from '@/hooks/useTicketRules';
import { useEligibility } from '@/hooks/useEligibility';
import { generatePlan, type ItineraryDay, type TicketPlanItem } from '@/lib/plannerUtils';
import { ALL_CATALOG_ITEMS } from '@/lib/eligibilityCatalog';
import { EligibilitySection } from '@/components/plan/EligibilitySummary';
import { ItineraryTab } from '@/components/plan/ItineraryTab';
import { TicketPlanTab } from '@/components/plan/TicketPlanTab';

export default function TripPlanPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCity = searchParams.get('city') || '';

  const { data: museums = [], isLoading: museumsLoading } = useMuseums();
  const { data: ticketRules = {}, isLoading: rulesLoading } = useTicketRules();
  const { eligibilities, userLocations, isLoading: eligLoading } = useEligibility();

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [startDate, setStartDate] = useState<Date>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date>(addDays(startOfDay(new Date()), 2));
  const [mode, setMode] = useState<'money' | 'time' | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Available cities from museums data
  const availableCities = useMemo(() => {
    const cityMap = new Map<string, { city: string; country: string; count: number }>();
    for (const m of museums) {
      const key = m.city.toLowerCase();
      if (!cityMap.has(key)) {
        cityMap.set(key, { city: m.city, country: m.country, count: 1 });
      } else {
        cityMap.get(key)!.count++;
      }
    }
    return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
  }, [museums]);

  // Filter cities for search
  const [citySearch, setCitySearch] = useState(initialCity);
  const filteredCities = useMemo(() => {
    if (!citySearch) return availableCities;
    return availableCities.filter(c =>
      c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.country.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [availableCities, citySearch]);

  // Compute plan
  const plan = useMemo(() => {
    if (!showResults || !selectedCity || !mode) return null;
    return generatePlan({
      city: selectedCity,
      startDate,
      endDate,
      mode,
      eligibility: eligibilities,
      userLocations,
      museums,
      ticketRules,
    });
  }, [showResults, selectedCity, startDate, endDate, mode, eligibilities, userLocations, museums, ticketRules]);

  const handleGenerate = () => {
    setShowResults(true);
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceedStep1 = selectedCity && startDate && endDate && endDate >= startDate;
  const canProceedStep2 = mode !== null;

  if (museumsLoading || rulesLoading) {
    return (
      <div className="container max-w-3xl py-8 space-y-4">
        <Skeleton className="w-64 h-8" />
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-full h-32" />
      </div>
    );
  }

  if (showResults && plan) {
    return (
      <div className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-73px)]">
        <div className="container max-w-3xl py-6">
          {/* Header */}
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to planner
          </button>
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {selectedCity} Trip Plan
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')} • {mode === 'money' ? '💰 Save Money' : '⚡ Save Time'}
            </p>
          </div>

          <Tabs defaultValue="itinerary">
            <TabsList className="w-full">
              <TabsTrigger value="itinerary" className="flex-1">Itinerary</TabsTrigger>
              <TabsTrigger value="tickets" className="flex-1">Best Ticket Plan</TabsTrigger>
            </TabsList>
            <TabsContent value="itinerary">
              <ItineraryTab itinerary={plan.itinerary} />
            </TabsContent>
            <TabsContent value="tickets">
              <TicketPlanTab ticketPlan={plan.ticketPlan} itinerary={plan.itinerary} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-73px)]">
      <div className="container max-w-2xl py-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold font-display',
                s < step ? 'bg-accent text-accent-foreground' :
                s === step ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={cn('w-8 h-0.5', s < step ? 'bg-accent' : 'bg-muted')} />}
            </div>
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            {step === 1 ? 'Destination & Dates' : step === 2 ? 'Planning Mode' : 'Eligibility'}
          </span>
        </div>

        {step > 1 && (
          <button onClick={handleBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Step 1: Destination + Dates */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold mb-1">Where are you going?</h2>
              <p className="text-sm text-muted-foreground">Choose a city from our museum database.</p>
            </div>

            {/* City selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <input
                type="text"
                value={citySearch}
                onChange={(e) => { setCitySearch(e.target.value); setSelectedCity(''); }}
                placeholder="Search cities…"
                className="w-full px-3 py-2 border border-input rounded-sm bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {(citySearch && !selectedCity) && (
                <div className="border border-border rounded-sm max-h-48 overflow-y-auto bg-popover">
                  {filteredCities.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No cities found</p>
                  ) : (
                    filteredCities.map(c => (
                      <button
                        key={c.city + c.country}
                        onClick={() => { setSelectedCity(c.city); setCitySearch(c.city); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                      >
                        <span>{c.city}, {c.country}</span>
                        <span className="text-xs text-muted-foreground">{c.count} museums</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedCity && (
                <p className="text-sm text-accent flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedCity} selected
                </p>
              )}
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarRange className="w-4 h-4 mr-2" />
                      {format(startDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => { if (d) { setStartDate(d); if (d > endDate) setEndDate(addDays(d, 2)); }}}
                      disabled={(d) => d < startOfDay(new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarRange className="w-4 h-4 mr-2" />
                      {format(endDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => { if (d) setEndDate(d); }}
                      disabled={(d) => d < startDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Mode */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold mb-1">How should we plan?</h2>
              <p className="text-sm text-muted-foreground">Pick a planning mode for {selectedCity}.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('money')}
                className={cn(
                  'gallery-card text-left p-6 transition-all',
                  mode === 'money' ? 'ring-2 ring-primary border-primary' : ''
                )}
              >
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-display text-lg font-semibold">Save Money</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Prioritize free days, discounts, and the cheapest ticket strategy.
                </p>
              </button>
              <button
                onClick={() => setMode('time')}
                className={cn(
                  'gallery-card text-left p-6 transition-all',
                  mode === 'time' ? 'ring-2 ring-primary border-primary' : ''
                )}
              >
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-display text-lg font-semibold">Save Time</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Group nearby museums together to minimize travel hassle.
                </p>
              </button>
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="w-full"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 3: Eligibility */}
        {step === 3 && (
          <EligibilitySection
            eligibilities={eligibilities}
            isLoading={eligLoading}
            onGenerate={handleGenerate}
          />
        )}
      </div>
    </div>
  );
}
