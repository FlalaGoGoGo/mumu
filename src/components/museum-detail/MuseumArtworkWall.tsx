import { useState, useMemo } from 'react';
import { Star, Frame, Sparkles, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import mumuLogo from '@/assets/mumu-logo.png';
import type { ArtworkRef, ExhibitionRef } from '@/types/museumDetail';

interface MuseumArtworkWallProps {
  artworks: ArtworkRef[];
  exhibitions: ExhibitionRef[];
  museumName: string;
  onArtworkClick?: (artwork: ArtworkRef) => void;
}

type FilterKey = 'all' | 'must_see' | 'on_view';

const INITIAL_COUNT = 12;
const LOAD_MORE_COUNT = 12;

export function MuseumArtworkWall({ artworks, exhibitions, museumName, onArtworkClick }: MuseumArtworkWallProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [showCount, setShowCount] = useState(INITIAL_COUNT);

  const mustSees = useMemo(() => artworks.filter(a => a.mustSee), [artworks]);
  const onView = useMemo(() => artworks.filter(a => a.isOnView), [artworks]);
  const currentExhibitions = useMemo(() => exhibitions.filter(e => e.status === 'current'), [exhibitions]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'must_see': return mustSees;
      case 'on_view': return onView;
      default: return artworks;
    }
  }, [filter, artworks, mustSees, onView]);

  const visible = filtered.slice(0, showCount);
  const hasMore = showCount < filtered.length;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Frame className="w-4 h-4 text-primary" />
          What's in this museum
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {artworks.length.toLocaleString()} works from {museumName}
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        <FilterChip
          active={filter === 'all'}
          onClick={() => { setFilter('all'); setShowCount(INITIAL_COUNT); }}
          label={`All (${artworks.length})`}
        />
        <FilterChip
          active={filter === 'must_see'}
          onClick={() => { setFilter('must_see'); setShowCount(INITIAL_COUNT); }}
          label={`Must-see (${mustSees.length})`}
          icon={<Star className="w-3 h-3" />}
        />
        <FilterChip
          active={filter === 'on_view'}
          onClick={() => { setFilter('on_view'); setShowCount(INITIAL_COUNT); }}
          label={`On view (${onView.length})`}
          icon={<Sparkles className="w-3 h-3" />}
        />
      </div>

      {/* Artwork grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {visible.map(art => (
          <ArtworkWallTile key={art.id} artwork={art} onClick={onArtworkClick} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setShowCount(c => c + LOAD_MORE_COUNT)}
          className="w-full py-2.5 text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
          Show more ({filtered.length - showCount} remaining)
        </button>
      )}

      {/* Current exhibitions */}
      {currentExhibitions.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Frame className="w-3.5 h-3.5 text-accent" />
            Current Exhibitions
          </h3>
          <div className="space-y-2">
            {currentExhibitions.map(ex => (
              <div key={ex.id} className="p-3 bg-card border border-border rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{ex.title}</p>
                  {ex.requiresAddOnTicket && (
                    <Badge variant="secondary" className="text-[0.65rem] flex-shrink-0">Extra ticket</Badge>
                  )}
                </div>
                {ex.shortDescription && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ex.shortDescription}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {ex.startDate && ex.endDate
                    ? `${new Date(ex.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(ex.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Dates TBD'
                  }
                </p>
                {ex.officialUrl && (
                  <a href={ex.officialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                    View on official site →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ArtworkWallTile({ artwork, onClick }: { artwork: ArtworkRef; onClick?: (a: ArtworkRef) => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onClick?.(artwork)}
      className="group text-left cursor-pointer"
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-secondary/30 border border-border hover:border-primary/30 relative transition-colors">
        {artwork.imageUrl && !imgError ? (
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-secondary/20">
            <img src={mumuLogo} alt="" className="w-8 h-8 opacity-15" />
            <span className="text-[0.6rem] text-muted-foreground">Image unavailable</span>
          </div>
        )}

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="text-xs font-medium text-white line-clamp-2 leading-tight">{artwork.title}</p>
            <p className="text-[0.6rem] text-white/70 mt-0.5 truncate">{artwork.artistTitle}</p>
          </div>
        </div>

        {/* Must-see badge */}
        {artwork.mustSee && (
          <div className="absolute top-1.5 right-1.5">
            <Badge className="bg-amber-100/90 text-amber-800 border-amber-200 text-[0.55rem] px-1.5 py-0 h-4 backdrop-blur-sm">
              <Star className="w-2.5 h-2.5 mr-0.5" /> Must-see
            </Badge>
          </div>
        )}

        {/* Gallery number */}
        {artwork.galleryNumber && (
          <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[0.55rem] bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
              Gallery {artwork.galleryNumber}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function FilterChip({ active, onClick, label, icon }: {
  active: boolean; onClick: () => void; label: string; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border bg-card hover:bg-secondary text-foreground'
      )}
    >
      {icon} {label}
    </button>
  );
}
