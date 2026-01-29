import { cn } from '@/lib/utils';
import { Award, MapPin, Flag, Globe } from 'lucide-react';

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: 'road-tripper' | 'explorer' | 'collector';
  unlocked: boolean;
}

const iconMap = {
  'road-tripper': MapPin,
  'explorer': Flag,
  'collector': Globe,
};

export function AchievementBadge({ title, description, icon, unlocked }: AchievementBadgeProps) {
  const Icon = iconMap[icon];
  
  return (
    <div 
      className={cn(
        "gallery-card flex items-center gap-3 transition-all",
        unlocked 
          ? "border-accent/50 bg-accent/5" 
          : "opacity-50 grayscale"
      )}
    >
      <div 
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          unlocked 
            ? "bg-accent text-accent-foreground" 
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <h4 className={cn(
          "font-display font-semibold text-sm",
          unlocked ? "text-foreground" : "text-muted-foreground"
        )}>
          {title}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {description}
        </p>
      </div>
      {unlocked && (
        <Award className="w-4 h-4 text-accent ml-auto flex-shrink-0" />
      )}
    </div>
  );
}
