import { cn } from '@/lib/utils';

interface YearFilterProps {
  years: number[];
  selectedYear: number | null; // null = all-time
  onYearChange: (year: number | null) => void;
}

export function YearFilter({ years, selectedYear, onYearChange }: YearFilterProps) {
  if (years.length === 0) return null;

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
      <button
        onClick={() => onYearChange(null)}
        className={cn(
          'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border',
          selectedYear === null
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-muted-foreground border-border hover:bg-muted'
        )}
      >
        All Time
      </button>
      {years.map((year) => (
        <button
          key={year}
          onClick={() => onYearChange(selectedYear === year ? null : year)}
          className={cn(
            'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border tabular-nums',
            selectedYear === year
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          )}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
