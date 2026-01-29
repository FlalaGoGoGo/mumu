import { Palette, History, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MuseumCategory = 'all' | 'art' | 'history' | 'science';

interface CategoryFilterProps {
  selected: MuseumCategory;
  onSelect: (category: MuseumCategory) => void;
  counts?: {
    all: number;
    art: number;
    history: number;
    science: number;
  };
}

const categories: { value: MuseumCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: null },
  { value: 'art', label: 'Art', icon: <Palette className="w-3.5 h-3.5" /> },
  { value: 'history', label: 'History', icon: <History className="w-3.5 h-3.5" /> },
  { value: 'science', label: 'Science', icon: <FlaskConical className="w-3.5 h-3.5" /> },
];

export function CategoryFilter({ selected, onSelect, counts }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-1.5">
      {categories.map((category) => {
        const isSelected = selected === category.value;
        const count = counts?.[category.value];
        
        return (
          <button
            key={category.value}
            onClick={() => onSelect(category.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
            )}
          >
            {category.icon}
            <span>{category.label}</span>
            {count !== undefined && (
              <span className={cn(
                "text-xs tabular-nums",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground/70"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
