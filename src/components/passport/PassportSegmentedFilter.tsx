import { cn } from '@/lib/utils';

interface Segment {
  value: string;
  label: string;
  count?: number;
}

interface PassportSegmentedFilterProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
}

export function PassportSegmentedFilter({ segments, value, onChange }: PassportSegmentedFilterProps) {
  return (
    <div className="flex rounded-sm border border-border overflow-hidden">
      {segments.map((seg, i) => (
        <button
          key={seg.value}
          onClick={() => onChange(seg.value)}
          className={cn(
            'flex-1 py-2 px-2 text-[11px] sm:text-xs font-display font-semibold uppercase tracking-wide transition-colors',
            i < segments.length - 1 && 'border-r border-border',
            value === seg.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:bg-muted'
          )}
        >
          {seg.label}
          {seg.count !== undefined && (
            <span className="ml-1 opacity-70 tabular-nums">({seg.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
