import { Sparkles } from 'lucide-react';
import type { TierProgress } from '@/lib/achievements';
import { TIER_LABELS } from '@/lib/achievements';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { tagIcons } from './AchievementWall';

interface NextToUnlockProps {
  items: TierProgress[];
}

export function NextToUnlock({ items }: NextToUnlockProps) {
  const { t, tp } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="gallery-card text-center py-6">
        <Sparkles className="w-8 h-8 mx-auto text-accent mb-2" />
        <p className="text-muted-foreground">
          {t('passport.allUnlocked')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <h3 className="font-display text-lg font-semibold text-foreground">
          {t('passport.nextToUnlock')}
        </h3>
      </div>
      
      <div className="grid gap-3">
        {items.map((tierProgress, index) => {
          const { achievement, tier, current, target, remaining } = tierProgress;
          const progressPercent = Math.min((current / target) * 100, 100);
          
          const iconKey = achievement.tag || achievement.id;
          const icon = tagIcons[iconKey];

          return (
            <div 
              key={`${achievement.id}-${tier.tier}`}
              className="gallery-card flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                {icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-semibold text-sm text-foreground truncate">
                    {achievement.name}
                  </h4>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                    {TIER_LABELS[tier.tier]}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={progressPercent} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {current}/{target}
                  </span>
                </div>
                
                <p className="text-xs text-accent mt-0.5">
                  {tp('passport.needMore', { count: remaining })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
