import { Building2, Flag, Grid3X3, Palette, Scroll, FlaskConical, Leaf, Landmark, ChevronRight } from 'lucide-react';
import type { CategoryProgress, AchievementProgress } from '@/lib/achievements';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface AchievementWallProps {
  categories: CategoryProgress[];
  onCategoryClick: (category: CategoryProgress) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  museums: <Building2 className="w-5 h-5" />,
  states: <Flag className="w-5 h-5" />,
  categories: <Grid3X3 className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  museums: 'bg-primary/10 text-primary border-primary/20',
  states: 'bg-secondary/10 text-secondary border-secondary/20',
  categories: 'bg-accent/10 text-accent border-accent/20',
};

export function AchievementWall({ categories, onCategoryClick }: AchievementWallProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold text-foreground">
        Achievement Wall
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {categories.map((category) => {
          const progressPercent = category.totalTiers > 0 
            ? (category.unlockedTiers / category.totalTiers) * 100 
            : 0;
          
          return (
            <button
              key={category.category}
              onClick={() => onCategoryClick(category)}
              className={cn(
                "gallery-card text-left transition-all hover:scale-[1.02] hover:shadow-md",
                "flex flex-col gap-3"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center border",
                    categoryColors[category.category]
                  )}>
                    {categoryIcons[category.category]}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-foreground">
                      {category.label}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {category.unlockedTiers}/{category.totalTiers} tiers
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              
              <Progress 
                value={progressPercent} 
                className="h-1.5"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Category detail icons for tags
export const tagIcons: Record<string, React.ReactNode> = {
  art: <Palette className="w-4 h-4" />,
  history: <Scroll className="w-4 h-4" />,
  science: <FlaskConical className="w-4 h-4" />,
  nature: <Leaf className="w-4 h-4" />,
  temple: <Landmark className="w-4 h-4" />,
  category_collector: <Grid3X3 className="w-4 h-4" />,
  museum_hopper: <Building2 className="w-4 h-4" />,
  state_explorer: <Flag className="w-4 h-4" />,
};
