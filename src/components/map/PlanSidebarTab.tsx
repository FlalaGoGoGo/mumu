import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { CalendarRange, DollarSign, Zap, Check, AlertCircle, Pencil, SkipForward, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useEligibility } from '@/hooks/useEligibility';
import { DiscountsContent } from '@/components/settings/DiscountsCard';
import { ALL_CATALOG_ITEMS } from '@/lib/eligibilityCatalog';
import type { Museum } from '@/types/museum';

interface PlanSidebarTabProps {
  museums: Museum[];
  currentCity?: string | null;
}

export function PlanSidebarTab({ museums, currentCity }: PlanSidebarTabProps) {
  const navigate = useNavigate();
  const { eligibilities, isLoading, preferences, updatePreferences } = useEligibility();
  const [eligDrawerOpen, setEligDrawerOpen] = useState(false);

  // Unique cities from museums
  const cities = useMemo(() => {
    const set = new Set(museums.map(m => m.city));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [museums]);

  const [city, setCity] = useState<string>(currentCity || '');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 2));
  const [mode, setMode] = useState<'money' | 'time'>('money');
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const handleGenerate = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    params.set('start', format(startDate, 'yyyy-MM-dd'));
    params.set('end', format(endDate, 'yyyy-MM-dd'));
    params.set('mode', mode);
    navigate(`/plan?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* Trip Basics */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Trip Basics
        </h3>

        {/* City */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Destination</label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a city…" />
            </SelectTrigger>
            <SelectContent className="z-[9999] max-h-64">
              {cities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Start</label>
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                  <CalendarRange className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {format(startDate, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    if (d) {
                      setStartDate(d);
                      if (d > endDate) setEndDate(addDays(d, 1));
                    }
                    setStartOpen(false);
                  }}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">End</label>
            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                  <CalendarRange className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {format(endDate, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    if (d) setEndDate(d);
                    setEndOpen(false);
                  }}
                  disabled={(d) => d < startDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Mode */}
      <div className="space-y-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Planning Mode
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('money')}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm font-medium",
              mode === 'money'
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-muted-foreground/40"
            )}
          >
            <DollarSign className="w-5 h-5" />
            Save Money 💰
          </button>
          <button
            onClick={() => setMode('time')}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm font-medium",
              mode === 'time'
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-muted-foreground/40"
            )}
          >
            <Zap className="w-5 h-5" />
            Save Time ⚡
          </button>
        </div>
      </div>

      {/* Eligibility */}
      <div className="space-y-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Eligibility
        </h3>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-2">Loading…</p>
        ) : eligibilities.length > 0 ? (
          <div className="gallery-card space-y-2 p-3">
            <div className="flex flex-wrap gap-1.5">
              {eligibilities.map(item => {
                const cat = ALL_CATALOG_ITEMS.find(c => c.type === item.type);
                return (
                  <span key={item.type} className="museum-chip text-xs flex items-center gap-1">
                    <Check className="w-3 h-3 text-accent" />
                    {cat?.icon} {cat?.label || item.type}
                  </span>
                );
              })}
            </div>
            <Sheet open={eligDrawerOpen} onOpenChange={setEligDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader><SheetTitle>Discounts & Eligibility</SheetTitle></SheetHeader>
                <div className="mt-4">
                  <DiscountsContent preferences={preferences} onUpdate={updatePreferences} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="gallery-card text-center py-4 px-3">
            <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-2">No eligibility profile yet</p>
            <Sheet open={eligDrawerOpen} onOpenChange={setEligDrawerOpen}>
              <SheetTrigger asChild>
                <Button size="sm" className="h-7 text-xs">Set Eligibility</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader><SheetTitle>Discounts & Eligibility</SheetTitle></SheetHeader>
                <div className="mt-4">
                  <DiscountsContent preferences={preferences} onUpdate={updatePreferences} />
                </div>
              </SheetContent>
            </Sheet>
            <p className="text-[10px] text-destructive mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" /> Prices may be less accurate without eligibility.
            </p>
          </div>
        )}
      </div>

      {/* Generate CTA */}
      <Button onClick={handleGenerate} className="w-full" disabled={!city}>
        Generate Plan
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
      {eligibilities.length === 0 && (
        <Button variant="ghost" size="sm" onClick={handleGenerate} className="w-full text-muted-foreground" disabled={!city}>
          <SkipForward className="w-4 h-4 mr-1" /> Skip eligibility
        </Button>
      )}
    </div>
  );
}
