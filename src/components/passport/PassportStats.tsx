import { MapPin, Globe, Palette, Heart } from 'lucide-react';

interface PassportStatsProps {
  museumsVisited: number;
  countriesVisited: number;
  artworksSeen: number;
  wishlistCompleted: number;
}

const stats = [
  { key: 'museums', icon: MapPin, label: 'Museums', color: 'text-primary' },
  { key: 'countries', icon: Globe, label: 'Countries', color: 'text-accent' },
  { key: 'artworks', icon: Palette, label: 'Artworks', color: 'text-[hsl(var(--gold-border))]' },
  { key: 'wishlist', icon: Heart, label: 'Completed', color: 'text-destructive' },
] as const;

export function PassportStats({
  museumsVisited,
  countriesVisited,
  artworksSeen,
  wishlistCompleted,
}: PassportStatsProps) {
  const values: Record<string, number> = {
    museums: museumsVisited,
    countries: countriesVisited,
    artworks: artworksSeen,
    wishlist: wishlistCompleted,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ key, icon: Icon, label, color }) => (
        <div key={key} className="gallery-card text-center py-5">
          <div className={`font-display text-4xl md:text-5xl font-bold ${color} mb-1 tabular-nums`}>
            {values[key]}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
            <Icon className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wider">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
