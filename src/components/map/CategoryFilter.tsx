import { Palette, Scroll, FlaskConical, Leaf, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

export type MuseumCategory = 'all' | 'art' | 'history' | 'science' | 'nature' | 'temple';

interface CategoryFilterProps {
  selected: MuseumCategory;
  onSelect: (category: MuseumCategory) => void;
  counts?: {
    all: number;
    art: number;
    history: number;
    science: number;
    nature: number;
    temple: number;
  };
}

const categoryIcons: Record<MuseumCategory, React.ReactNode> = {
  all: null,
  art: <Palette className="w-3.5 h-3.5" />,
  history: <Scroll className="w-3.5 h-3.5" />,
  science: <FlaskConical className="w-3.5 h-3.5" />,
  nature: <Leaf className="w-3.5 h-3.5" />,
  temple: <Landmark className="w-3.5 h-3.5" />,
};

const categoryKeys: MuseumCategory[] = ['all', 'art', 'history', 'science', 'nature', 'temple'];

export function CategoryFilter({ selected, onSelect, counts }: CategoryFilterProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {categoryKeys.map((categoryValue) => {
        const isSelected = selected === categoryValue;
        const count = counts?.[categoryValue];
        const label = t(`category.${categoryValue}` as any);
        
        return (
          <button
            key={categoryValue}
            onClick={() => onSelect(categoryValue)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
            )}
          >
            {categoryIcons[categoryValue]}
            <span>{label}</span>
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
