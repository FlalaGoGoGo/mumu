import { useState } from 'react';
import { ChevronDown, LayoutGrid, Palette, Scroll, FlaskConical, Leaf, Landmark, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

export type MuseumCategory = 'art' | 'history' | 'science' | 'nature' | 'temple';

interface CategoryFilterDropdownProps {
  selected: MuseumCategory[];
  onSelectionChange: (categories: MuseumCategory[]) => void;
  counts?: Record<MuseumCategory, number>;
}

const categoryIcons: Record<MuseumCategory, React.ReactNode> = {
  art: <Palette className="w-4 h-4" />,
  history: <Scroll className="w-4 h-4" />,
  science: <FlaskConical className="w-4 h-4" />,
  nature: <Leaf className="w-4 h-4" />,
  temple: <Landmark className="w-4 h-4" />,
};

const categoryKeys: MuseumCategory[] = ['art', 'history', 'science', 'nature', 'temple'];

export function CategoryFilterDropdown({ selected, onSelectionChange, counts }: CategoryFilterDropdownProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleCategory = (category: MuseumCategory) => {
    if (selected.includes(category)) {
      onSelectionChange(selected.filter(c => c !== category));
    } else {
      onSelectionChange([...selected, category]);
    }
  };

  const clearAll = () => {
    onSelectionChange([]);
    setIsOpen(false);
  };

  const hasSelection = selected.length > 0;
  const totalCount = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  const getButtonLabel = () => {
    if (selected.length === 0) return t('map.category');
    if (selected.length === 1) return t(`category.${selected[0]}` as any);
    return `${selected.length} ${t('map.category').toLowerCase()}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            hasSelection
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>{getButtonLabel()}</span>
          {hasSelection && (
            <span className="text-xs tabular-nums text-primary-foreground/80">
              ({selected.length})
            </span>
          )}
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-56 p-0 z-[9999]"
        align="start"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        avoidCollisions
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('map.category')}
          </span>
          {hasSelection && (
            <button
              onClick={clearAll}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              {t('common.clear')}
            </button>
          )}
        </div>

        {/* Category List */}
        <div className="py-1 max-h-[70vh] overflow-y-auto">
          {categoryKeys.map((category) => {
            const isSelected = selected.includes(category);
            const count = counts?.[category] ?? 0;
            const label = t(`category.${category}` as any);

            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isSelected && "bg-primary/10"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border"
                )}>
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
                <span className="text-muted-foreground">{categoryIcons[category]}</span>
                <span className="flex-1 text-left">{label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {hasSelection
              ? `${selected.length} selected`
              : `${totalCount} total`}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
