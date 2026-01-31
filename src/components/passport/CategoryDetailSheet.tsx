import { Lock, CheckCircle } from 'lucide-react';
import type { CategoryProgress, AchievementProgress, TierProgress } from '@/lib/achievements';
import { TIER_LABELS, type AchievementTier } from '@/lib/achievements';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { tagIcons } from './AchievementWall';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategoryDetailSheetProps {
  category: CategoryProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tierColors: Record<AchievementTier, string> = {
  bronze: 'bg-amber-700/10 text-amber-700 border-amber-700/30',
  silver: 'bg-slate-400/10 text-slate-500 border-slate-400/30',
  gold: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  platinum: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
};

const tierBgColors: Record<AchievementTier, string> = {
  bronze: 'from-amber-700/20',
  silver: 'from-slate-400/20',
  gold: 'from-yellow-500/20',
  platinum: 'from-cyan-500/20',
};

function AchievementTierCard({ tierProgress }: { tierProgress: TierProgress }) {
  const { achievement, tier, current, target, unlocked } = tierProgress;
  const progressPercent = Math.min((current / target) * 100, 100);
  
  // Get the right icon based on achievement id
  const iconKey = achievement.tag || achievement.id;
  const icon = tagIcons[iconKey];

  return (
    <div 
      className={cn(
        "gallery-card relative overflow-hidden transition-all",
        unlocked ? "border-primary/30" : "opacity-60 grayscale-[30%]"
      )}
    >
      {/* Gradient overlay for unlocked */}
      {unlocked && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br to-transparent opacity-50",
          tierBgColors[tier.tier]
        )} />
      )}
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {icon}
            </div>
            <div>
              <h4 className="font-display font-semibold text-sm text-foreground">
                {achievement.name}
              </h4>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded border",
                tierColors[tier.tier]
              )}>
                {TIER_LABELS[tier.tier]}
              </span>
            </div>
          </div>
          
          {unlocked ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Lock className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          {achievement.description}
        </p>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className={unlocked ? "text-green-600 font-medium" : "text-foreground"}>
              {current}/{target}
            </span>
          </div>
          <Progress 
            value={progressPercent} 
            className={cn("h-1.5", unlocked && "[&>div]:bg-green-600")}
          />
        </div>
      </div>
    </div>
  );
}

export function CategoryDetailSheet({ category, open, onOpenChange }: CategoryDetailSheetProps) {
  if (!category) return null;

  // Flatten all tiers from all achievements in this category
  const allTiers = category.achievements.flatMap(a => a.tiers);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="font-display text-xl">
            {category.label} Achievements
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {category.unlockedTiers} of {category.totalTiers} tiers unlocked
          </p>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(80vh-100px)] mt-4 -mx-6 px-6">
          <div className="grid gap-3 pb-6">
            {allTiers.map((tierProgress, index) => (
              <AchievementTierCard key={index} tierProgress={tierProgress} />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
