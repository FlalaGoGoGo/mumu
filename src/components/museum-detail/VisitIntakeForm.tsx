import { useState } from 'react';
import {
  Clock, Baby, Accessibility, Coffee, Sparkles, ChevronDown,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VisitIntake, MuseumEntrance } from '@/types/museumDetail';

const TIME_OPTIONS = [
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4+ hours' },
];

const PACE_OPTIONS: Array<{ value: VisitIntake['pace']; label: string; emoji: string }> = [
  { value: 'slow', label: 'Slow & relaxed', emoji: '🐌' },
  { value: 'steady', label: 'Steady', emoji: '🚶' },
  { value: 'fast', label: 'Fast highlights', emoji: '⚡' },
];

const FOOD_OPTIONS: Array<{ value: VisitIntake['foodPlan']; label: string }> = [
  { value: 'none', label: 'No food' },
  { value: 'coffee_break', label: 'Coffee break' },
  { value: 'light_meal', label: 'Light meal' },
  { value: 'full_meal', label: 'Full meal' },
];

const INTEREST_OPTIONS = [
  'Iconic paintings', 'Impressionism', 'Modern art', 'Ancient art',
  'Photography', 'Asian art', 'Architecture', 'Sculpture',
];

interface VisitIntakeFormProps {
  museumId: string;
  entrances: MuseumEntrance[];
  onSubmit: (intake: Partial<VisitIntake>) => void;
}

export function VisitIntakeForm({ museumId, entrances, onSubmit }: VisitIntakeFormProps) {
  const [timeBudget, setTimeBudget] = useState<number | null>(120);
  const [withChildren, setWithChildren] = useState(false);
  const [withStroller, setWithStroller] = useState(false);
  const [largeBags, setLargeBags] = useState(false);
  const [needsAccessibility, setNeedsAccessibility] = useState(false);
  const [foodPlan, setFoodPlan] = useState<VisitIntake['foodPlan']>('none');
  const [pace, setPace] = useState<VisitIntake['pace']>('steady');
  const [interests, setInterests] = useState<string[]>([]);
  const [entranceId, setEntranceId] = useState<string | null>(entrances[0]?.id || null);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleSubmit = () => {
    onSubmit({
      museumId,
      visitDate: new Date().toISOString().split('T')[0],
      timeBudgetMinutes: timeBudget,
      withChildren,
      withStroller,
      largeBags,
      needsAccessibility,
      foodPlan,
      pace,
      interests,
      entryEntranceId: entranceId,
      groupProfile: withChildren ? 'family' : 'adults',
      mustSeeArtworkIds: [],
      mustSeeExhibitionIds: [],
    });
  };

  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Personalize Your Visit
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tell MuMu about your visit so we can suggest the best plan.
          </p>
        </div>
      </div>

      {/* Time budget */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5" /> Time available
        </label>
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTimeBudget(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-colors',
                timeBudget === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background hover:bg-secondary text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pace */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Pace
        </label>
        <div className="flex gap-2">
          {PACE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPace(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5',
                pace === opt.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-background hover:bg-secondary text-foreground'
              )}
            >
              <span>{opt.emoji}</span> {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick toggles */}
      <div className="flex flex-wrap gap-2">
        <ToggleChip active={withChildren} onClick={() => setWithChildren(!withChildren)} icon={<Baby className="w-3.5 h-3.5" />} label="With children" />
        <ToggleChip active={largeBags} onClick={() => setLargeBags(!largeBags)} icon={<Briefcase className="w-3.5 h-3.5" />} label="Large bags" />
        <ToggleChip active={needsAccessibility} onClick={() => setNeedsAccessibility(!needsAccessibility)} icon={<Accessibility className="w-3.5 h-3.5" />} label="Accessibility" />
        <ToggleChip active={withStroller} onClick={() => setWithStroller(!withStroller)} icon={<Baby className="w-3.5 h-3.5" />} label="Stroller" />
      </div>

      {/* Expandable section */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        More options <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} />
      </button>

      {isExpanded && (
        <div className="space-y-5 animate-in slide-in-from-top-2 duration-200">
          {/* Food */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Coffee className="w-3.5 h-3.5" /> Food & drink
            </label>
            <div className="flex flex-wrap gap-2">
              {FOOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFoodPlan(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                    foodPlan === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-background hover:bg-secondary text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(i => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                    interests.includes(i)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-background hover:bg-secondary text-foreground'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Entrance */}
          {entrances.length > 1 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Preferred entrance
              </label>
              <div className="flex flex-col gap-2">
                {entrances.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setEntranceId(e.id)}
                    className={cn(
                      'text-left p-3 rounded-lg border transition-colors',
                      entranceId === e.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary/50'
                    )}
                  >
                    <p className="text-sm font-medium">{e.name}</p>
                    {e.summary && <p className="text-xs text-muted-foreground mt-0.5">{e.summary}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <Button onClick={handleSubmit} className="w-full gap-2" size="lg">
        <Sparkles className="w-4 h-4" />
        Build My Visit Plan
      </Button>
    </section>
  );
}

function ToggleChip({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border bg-background hover:bg-secondary text-foreground'
      )}
    >
      {icon} {label}
    </button>
  );
}
