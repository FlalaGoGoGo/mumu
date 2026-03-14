import { Palette, Building2, Globe } from 'lucide-react';

interface ExhibitionProvenanceStatsProps {
  artworkCount: number;
  museumCount: number;
  countryCount: number;
}

export function ExhibitionProvenanceStats({
  artworkCount,
  museumCount,
  countryCount,
}: ExhibitionProvenanceStatsProps) {
  if (artworkCount === 0) return null;

  const stats = [
    { icon: Palette, value: artworkCount, label: artworkCount === 1 ? 'Artwork' : 'Artworks' },
    { icon: Building2, value: museumCount, label: museumCount === 1 ? 'Lending Museum' : 'Lending Museums' },
    { icon: Globe, value: countryCount, label: countryCount === 1 ? 'Country' : 'Countries' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-sm border border-border bg-card/60"
        >
          <Icon className="w-4 h-4 text-accent" />
          <span className="font-display text-xl font-bold text-foreground tabular-nums">
            {value}
          </span>
          <span className="text-[11px] text-muted-foreground text-center leading-tight">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
