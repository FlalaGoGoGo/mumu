import { FlaskConical } from 'lucide-react';

interface ExhibitionResearchBadgeProps {
  exhibitionId: string;
}

/** IDs of exhibitions using research-demo datasets rather than official checklists */
const RESEARCH_DEMO_EXHIBITIONS = new Set(['exhibition_07323']);

export function ExhibitionResearchBadge({ exhibitionId }: ExhibitionResearchBadgeProps) {
  if (!RESEARCH_DEMO_EXHIBITIONS.has(exhibitionId)) return null;

  return (
    <div className="flex items-start gap-2 rounded-sm border border-accent/25 bg-accent/5 px-3 py-2.5">
      <FlaskConical className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-medium text-foreground">Research Demo Dataset</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
          This artwork list is a curated research sample based on publicly announced lenders, not the official full exhibition checklist.
        </p>
      </div>
    </div>
  );
}
