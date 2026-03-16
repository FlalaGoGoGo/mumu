import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Citation, SourceKind } from '@/types/museumDetail';

const SOURCE_COLORS: Record<SourceKind, string> = {
  official_live: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  official_api: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  mumu_static: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  mumu_generated: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
};

interface CitationChipProps {
  citation: Citation;
  compact?: boolean;
}

export function CitationChip({ citation, compact }: CitationChipProps) {
  return (
    <a
      href={citation.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-medium transition-opacity hover:opacity-80',
        SOURCE_COLORS[citation.sourceKind]
      )}
    >
      {!compact && <ExternalLink className="w-2.5 h-2.5" />}
      {citation.label}
    </a>
  );
}
