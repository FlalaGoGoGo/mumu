import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, MapPin, CalendarRange, Clock, ChevronRight, Pencil, SkipForward, AlertCircle } from 'lucide-react';
import { addDays, startOfDay, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useVisitPlans, generateVisitName } from '@/hooks/useVisitPlans';
import { useMuseums } from '@/hooks/useMuseums';
import { useEligibility } from '@/hooks/useEligibility';
import { useTicketRules } from '@/hooks/useTicketRules';
import { buildLocationHierarchy } from '@/lib/locationHierarchy';
import { generatePlan } from '@/lib/plannerUtils';
import { EligibilitySection } from '@/components/plan/EligibilitySummary';
import type { Stop, Visit } from '@/types/visit';

export function VisitEditor() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { getVisit, updateVisit, createVisit } = useVisitPlans();
  const { data: museums = [] } = useMuseums();
  const { data: ticketRules = {} } = useTicketRules();
  const { eligibilities, userLocations, isLoading: eligLoading } = useEligibility();

  const hierarchy = useMemo(() => buildLocationHierarchy(museums), [museums]);

  // Load or create visit
  const existingVisit = visitId ? getVisit(visitId) : undefined;
  const [visit, setVisit] = useState<Visit>(() => {
    if (existingVisit) return { ...existingVisit };
    const v = createVisit();
    // Navigate to the canonical edit URL for the new visit
    setTimeout(() => navigate(`/plan/${v.id}/edit`, { replace: true }), 0);
    return v;
  });

  // Stable visitId: prefer URL param, fall back to local visit id
  const effectiveId = visitId || visit.id;

  const update = (changes: Partial<Visit>) => {
    const updated = { ...visit, ...changes };
    setVisit(updated);
    updateVisit(effectiveId, changes);
  };

  // Stop management
  const addStop = () => {
    const newStop: Stop = { id: crypto.randomUUID(), radiusKm: 25 };
    update({ stops: [...visit.stops, newStop] });
  };

  const updateStop = (stopId: string, changes: Partial<Stop>) => {
    update({
      stops: visit.stops.map(s => s.id === stopId ? { ...s, ...changes } : s),
    });
  };

  const removeStop = (stopId: string) => {
    update({ stops: visit.stops.filter(s => s.id !== stopId) });
  };

  // Generate handler
  const handleGenerate = () => {
    // Collect all museums matching stops
    const candidateMuseums = museums.filter(m => {
      return visit.stops.some(stop => {
        if (stop.city && m.city.toLowerCase() === stop.city.toLowerCase()) return true;
        if (stop.state && m.state === stop.state && !stop.city) return true;
        if (stop.country && m.country === stop.country && !stop.state && !stop.city) return true;
        // Radius check
        if (stop.city && stop.radiusKm > 0) {
          const cityMuseum = museums.find(cm => cm.city.toLowerCase() === stop.city!.toLowerCase());
          if (cityMuseum) {
            const dist = Math.sqrt(
              Math.pow((m.lat - cityMuseum.lat) * 111, 2) +
              Math.pow((m.lng - cityMuseum.lng) * 111 * Math.cos(cityMuseum.lat * Math.PI / 180), 2)
            );
            if (dist <= stop.radiusKm) return true;
          }
        }
        return false;
      });
    });

    const startDate = visit.dateMode === 'fixed' && visit.startDate
      ? new Date(visit.startDate)
      : startOfDay(new Date());
    const endDate = visit.dateMode === 'fixed' && visit.endDate
      ? new Date(visit.endDate)
      : addDays(startDate, (visit.flexibleDays || 3) - 1);

    const plan = generatePlan({
      city: '',
      startDate,
      endDate,
      mode: visit.mode,
      eligibility: eligibilities,
      userLocations: { city: userLocations.city || '', region: userLocations.region || '', country: userLocations.country || '' },
      museums: candidateMuseums,
      ticketRules,
    });

    // Auto-generate name if empty
    const finalName = visit.name.trim() || generateVisitName(visit);

    const updates: Partial<Visit> = {
      name: finalName,
      generatedAt: new Date().toISOString(),
      itinerary: plan.itinerary.map(d => ({
        ...d,
        date: d.date.toISOString(),
      })),
      ticketPlan: plan.ticketPlan,
    };

    // Persist FIRST, then navigate
    updateVisit(effectiveId, updates);
    setVisit(prev => ({ ...prev, ...updates }));
    navigate(`/plan/${effectiveId}`);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] md:min-h-[calc(100vh-73px)]">
      <div className="container max-w-2xl py-6">
        {/* Back */}
        <button onClick={() => navigate('/plan')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          My Visits
        </button>

        <h1 className="font-display text-2xl font-bold mb-6">
          {existingVisit?.name ? `Edit: ${existingVisit.name}` : 'New Visit'}
        </h1>

        <div className="space-y-8">
          {/* 1) Visit Name */}
          <section className="space-y-2">
            <label className="text-sm font-medium">Visit Name</label>
            <Input
              value={visit.name}
              onChange={e => update({ name: e.target.value })}
              placeholder={generateVisitName(visit) || "e.g. Seattle Weekend Museums"}
            />
            {!visit.name.trim() && visit.stops.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Auto-name: {generateVisitName(visit)}
              </p>
            )}
          </section>

          {/* 2) Places / Stops */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Places</h2>
              <Button variant="outline" size="sm" onClick={addStop} className="gap-1">
                <Plus className="w-3.5 h-3.5" />
                Add a place
              </Button>
            </div>

            {visit.stops.length === 0 && (
              <div className="gallery-card text-center py-8">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No places added yet. Add a destination to get started.</p>
                <Button variant="outline" size="sm" onClick={addStop} className="mt-3 gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Add a place
                </Button>
              </div>
            )}

            {visit.stops.map((stop, idx) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={idx}
                hierarchy={hierarchy}
                onUpdate={(changes) => updateStop(stop.id, changes)}
                onRemove={() => removeStop(stop.id)}
              />
            ))}
          </section>

          {/* 3) Dates */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Dates</h2>
            <div className="flex gap-2">
              <Button
                variant={visit.dateMode === 'fixed' ? 'default' : 'outline'}
                onClick={() => update({ dateMode: 'fixed' })}
                className="flex-1"
                size="sm"
              >
                Fixed dates
              </Button>
              <Button
                variant={visit.dateMode === 'flexible' ? 'default' : 'outline'}
                onClick={() => update({ dateMode: 'flexible' })}
                className="flex-1"
                size="sm"
              >
                Flexible / Not sure
              </Button>
            </div>

            {visit.dateMode === 'fixed' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                        <CalendarRange className="w-3.5 h-3.5 mr-2" />
                        {visit.startDate ? format(new Date(visit.startDate), 'MMM d, yyyy') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={visit.startDate ? new Date(visit.startDate) : undefined}
                        onSelect={d => {
                          if (d) {
                            update({ startDate: format(d, 'yyyy-MM-dd') });
                            if (!visit.endDate || new Date(visit.endDate) < d) {
                              update({ startDate: format(d, 'yyyy-MM-dd'), endDate: format(addDays(d, 2), 'yyyy-MM-dd') });
                            }
                          }
                        }}
                        disabled={d => d < startOfDay(new Date())}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">End</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal text-sm">
                        <CalendarRange className="w-3.5 h-3.5 mr-2" />
                        {visit.endDate ? format(new Date(visit.endDate), 'MMM d, yyyy') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={visit.endDate ? new Date(visit.endDate) : undefined}
                        onSelect={d => { if (d) update({ endDate: format(d, 'yyyy-MM-dd') }); }}
                        disabled={d => d < (visit.startDate ? new Date(visit.startDate) : startOfDay(new Date()))}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-medium">How many days? (optional)</label>
                <Select
                  value={visit.flexibleDays?.toString() || '__none__'}
                  onValueChange={v => update({ flexibleDays: v === '__none__' ? undefined : parseInt(v) })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Not sure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not sure</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'day' : 'days'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </section>

          {/* 4) Time budget */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Museum Time</h2>
            <div className="flex gap-2">
              <Button
                variant={visit.timeBudgetMode === 'all_day' ? 'default' : 'outline'}
                onClick={() => update({ timeBudgetMode: 'all_day' })}
                className="flex-1"
                size="sm"
              >
                All day
              </Button>
              <Button
                variant={visit.timeBudgetMode === 'time_window' ? 'default' : 'outline'}
                onClick={() => update({ timeBudgetMode: 'time_window' })}
                className="flex-1"
                size="sm"
              >
                <Clock className="w-3.5 h-3.5 mr-1" />
                Time window
              </Button>
            </div>
            {visit.timeBudgetMode === 'time_window' && (
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">From</label>
                  <Input
                    type="time"
                    value={visit.dailyTimeWindow?.start || '14:00'}
                    onChange={e => update({ dailyTimeWindow: { start: e.target.value, end: visit.dailyTimeWindow?.end || '17:00' } })}
                    className="w-32"
                  />
                </div>
                <span className="text-muted-foreground mt-5">–</span>
                <div className="space-y-1">
                  <label className="text-xs font-medium">To</label>
                  <Input
                    type="time"
                    value={visit.dailyTimeWindow?.end || '17:00'}
                    onChange={e => update({ dailyTimeWindow: { start: visit.dailyTimeWindow?.start || '14:00', end: e.target.value } })}
                    className="w-32"
                  />
                </div>
              </div>
            )}
          </section>

          {/* 5) Mode */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Planning Mode</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => update({ mode: 'money' })}
                className={cn(
                  'gallery-card text-left p-5 transition-all',
                  visit.mode === 'money' ? 'ring-2 ring-primary border-primary' : ''
                )}
              >
                <div className="text-2xl mb-2">💰</div>
                <h3 className="font-display font-semibold">Save Money</h3>
                <p className="text-xs text-muted-foreground mt-1">Free days, discounts, cheapest strategy.</p>
              </button>
              <button
                onClick={() => update({ mode: 'time' })}
                className={cn(
                  'gallery-card text-left p-5 transition-all',
                  visit.mode === 'time' ? 'ring-2 ring-primary border-primary' : ''
                )}
              >
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-display font-semibold">Save Time</h3>
                <p className="text-xs text-muted-foreground mt-1">Group nearby museums, less travel.</p>
              </button>
            </div>
          </section>

          {/* 6) Eligibility */}
          <section>
            <EligibilitySection
              eligibilities={eligibilities}
              isLoading={eligLoading}
              onGenerate={handleGenerate}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Stop Card ──
function StopCard({
  stop,
  index,
  hierarchy,
  onUpdate,
  onRemove,
}: {
  stop: Stop;
  index: number;
  hierarchy: ReturnType<typeof buildLocationHierarchy>;
  onUpdate: (changes: Partial<Stop>) => void;
  onRemove: () => void;
}) {
  const countriesForRegion = stop.region ? hierarchy.countries.get(stop.region) || [] : [];
  const statesForCountry = stop.country ? hierarchy.states.get(stop.country) || [] : [];
  const hasStates = statesForCountry.length > 0;
  const citiesKey = stop.state && stop.country ? `${stop.country}::${stop.state}` : stop.country || '';
  const citiesForSelection = citiesKey ? hierarchy.cities.get(citiesKey) || [] : [];

  return (
    <div className="gallery-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <span className="route-step text-xs w-6 h-6">{index + 1}</span>
          Place {index + 1}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Region */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Region</label>
          <Select
            value={stop.region || '__none__'}
            onValueChange={v => onUpdate({ region: v === '__none__' ? undefined : v, country: undefined, state: undefined, city: undefined })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select region</SelectItem>
              {hierarchy.regions.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div className="space-y-1">
          <label className="text-xs font-medium">Country</label>
          <Select
            value={stop.country || '__none__'}
            onValueChange={v => onUpdate({ country: v === '__none__' ? undefined : v, state: undefined, city: undefined })}
            disabled={!stop.region}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select country</SelectItem>
              {countriesForRegion.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State (if applicable) */}
        {hasStates && (
          <div className="space-y-1">
            <label className="text-xs font-medium">State / Province</label>
            <Select
              value={stop.state || '__none__'}
              onValueChange={v => onUpdate({ state: v === '__none__' ? undefined : v, city: undefined })}
              disabled={!stop.country}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Any state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Any</SelectItem>
                {statesForCountry.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* City */}
        <div className="space-y-1">
          <label className="text-xs font-medium">City</label>
          <Select
            value={stop.city || '__none__'}
            onValueChange={v => onUpdate({ city: v === '__none__' ? undefined : v })}
            disabled={!stop.country}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Any city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Any</SelectItem>
              {citiesForSelection.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Radius slider */}
      {stop.city && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Include nearby within</label>
            <span className="text-xs text-muted-foreground">{stop.radiusKm} km</span>
          </div>
          <Slider
            value={[stop.radiusKm]}
            onValueChange={([v]) => onUpdate({ radiusKm: v })}
            min={0}
            max={50}
            step={5}
          />
        </div>
      )}
    </div>
  );
}
