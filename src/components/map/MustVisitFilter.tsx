import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

interface MustVisitFilterProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  count?: number;
}

export function MustVisitFilter({ enabled, onToggle, count }: MustVisitFilterProps) {
  const { t } = useLanguage();

  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        enabled
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground hover:border-accent"
      )}
    >
      <Star className={cn("w-3.5 h-3.5", enabled && "fill-current")} />
      <span>{t('map.mustVisit')}</span>
    </button>
  );
}
