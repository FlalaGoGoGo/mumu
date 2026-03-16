import { cn } from '@/lib/utils';
import type { VisitIntake } from '@/types/museumDetail';

interface AppliedPreferencesProps {
  intake: Partial<VisitIntake>;
  className?: string;
}

export function AppliedPreferences({ intake, className }: AppliedPreferencesProps) {
  const tags: string[] = [];

  if (intake.timeBudgetMinutes) {
    const h = intake.timeBudgetMinutes / 60;
    tags.push(h >= 2 ? `${h} hours` : `${intake.timeBudgetMinutes} min`);
  }
  if (intake.pace && intake.pace !== 'steady') tags.push(`${intake.pace} pace`);
  if (intake.pace === 'steady') tags.push('steady pace');
  if (intake.withChildren) tags.push('with children');
  if (intake.needsAccessibility) tags.push('accessible route');
  if (intake.largeBags) tags.push('large bags');
  if (intake.withStroller) tags.push('stroller');
  if (intake.foodPlan && intake.foodPlan !== 'none') tags.push(intake.foodPlan.replace('_', ' '));

  if (tags.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      <span className="text-xs text-foreground/50 font-medium mr-1">Based on:</span>
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/60 text-xs text-foreground/70 border border-border"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
