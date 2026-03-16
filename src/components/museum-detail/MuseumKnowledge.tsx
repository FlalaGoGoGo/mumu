import { useState } from 'react';
import {
  Eye, Frame, Star, Baby, Accessibility, Volume2, UtensilsCrossed,
  ShoppingBag, AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CitationChip } from './CitationChip';
import mumuLogo from '@/assets/mumu-logo.png';
import type {
  KnowledgeTabKey,
  KnowledgeContent,
  ArtworkRef,
  ExhibitionRef,
  MuseumDetailOverview,
} from '@/types/museumDetail';

const TAB_ICONS: Record<KnowledgeTabKey, React.ReactNode> = {
  on_view_now: <Eye className="w-3.5 h-3.5" />,
  current_exhibitions: <Frame className="w-3.5 h-3.5" />,
  must_sees: <Star className="w-3.5 h-3.5" />,
  family: <Baby className="w-3.5 h-3.5" />,
  accessibility: <Accessibility className="w-3.5 h-3.5" />,
  quiet_spaces: <Volume2 className="w-3.5 h-3.5" />,
  dining: <UtensilsCrossed className="w-3.5 h-3.5" />,
  shop: <ShoppingBag className="w-3.5 h-3.5" />,
  know_before_you_go: <AlertCircle className="w-3.5 h-3.5" />,
};

interface MuseumKnowledgeProps {
  overview: MuseumDetailOverview;
  knowledge: KnowledgeContent;
  artworks: ArtworkRef[];
  exhibitions: ExhibitionRef[];
  onArtworkClick?: (artwork: ArtworkRef) => void;
}

export function MuseumKnowledge({ overview, knowledge, artworks, exhibitions, onArtworkClick }: MuseumKnowledgeProps) {
  const [activeTab, setActiveTab] = useState<KnowledgeTabKey>(
    overview.knowledgeTabs[0]?.key || 'on_view_now'
  );

  const mustSees = artworks.filter(a => a.mustSee);
  const onView = artworks.filter(a => a.isOnView);
  const currentExhibitions = exhibitions.filter(e => e.status === 'current');

  return (
    <section className="space-y-4">
      <h2 className="font-display text-lg font-semibold">Museum Knowledge</h2>

      {/* Tab scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {overview.knowledgeTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border whitespace-nowrap transition-colors flex-shrink-0',
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border bg-card hover:bg-secondary text-foreground'
            )}
          >
            {TAB_ICONS[tab.key]}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        {activeTab === 'on_view_now' && (
          <ArtworkGrid
            artworks={onView}
            emptyMessage="On-view artwork data is not available yet."
            note={`${onView.length} works currently on view from MuMu's catalog. Availability may change — check the official site for same-day confirmation.`}
            onArtworkClick={onArtworkClick}
          />
        )}

        {activeTab === 'must_sees' && (
          <ArtworkGrid
            artworks={mustSees}
            emptyMessage="No must-see artworks flagged yet."
            note="These are high-priority works recommended for first-time visitors."
            onArtworkClick={onArtworkClick}
          />
        )}

        {activeTab === 'current_exhibitions' && (
          <ExhibitionList exhibitions={currentExhibitions} />
        )}

        {activeTab === 'family' && knowledge.family && (
          <InfoList items={knowledge.family.items} citations={knowledge.family.citations} />
        )}

        {activeTab === 'accessibility' && knowledge.accessibility && (
          <InfoList items={knowledge.accessibility.items} citations={knowledge.accessibility.citations} />
        )}

        {activeTab === 'quiet_spaces' && knowledge.quietSpaces && (
          <div className="space-y-3">
            {knowledge.quietSpaces.tips.map((tip, i) => (
              <p key={i} className="text-sm text-foreground/70 flex items-start gap-2">
                <span className="text-accent mt-0.5">●</span> {tip}
              </p>
            ))}
          </div>
        )}

        {activeTab === 'dining' && knowledge.dining && (
          <div className="space-y-3">
            {knowledge.dining.venues.map((v, i) => (
              <div key={i} className="p-3 bg-background border border-border rounded-lg">
                <p className="text-sm font-medium text-foreground">{v.name}</p>
                <p className="text-xs text-foreground/60 mt-0.5">{v.description}</p>
                {v.location && <p className="text-xs text-foreground/50 mt-1 italic">{v.location}</p>}
              </div>
            ))}
            {knowledge.dining.citations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {knowledge.dining.citations.map(c => <CitationChip key={c.id} citation={c} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'shop' && knowledge.shop && (
          <div className="space-y-3">
            {knowledge.shop.shops.map((s, i) => (
              <div key={i} className="p-3 bg-background border border-border rounded-lg">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-foreground/60 mt-0.5">{s.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'know_before_you_go' && knowledge.knowBeforeYouGo && (
          <InfoList items={knowledge.knowBeforeYouGo.policies} citations={knowledge.knowBeforeYouGo.citations} />
        )}
      </div>
    </section>
  );
}

function ArtworkGrid({ artworks, emptyMessage, note, onArtworkClick }: {
  artworks: ArtworkRef[];
  emptyMessage: string;
  note?: string;
  onArtworkClick?: (artwork: ArtworkRef) => void;
}) {
  if (artworks.length === 0) {
    return (
      <div className="text-center py-8">
        <img src={mumuLogo} alt="" className="w-10 h-10 mx-auto opacity-20 mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {note && (
        <p className="text-xs text-foreground/50 italic">{note}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {artworks.map(art => (
          <ArtworkTile key={art.id} artwork={art} onClick={onArtworkClick} />
        ))}
      </div>
    </div>
  );
}

function ArtworkTile({ artwork, onClick }: { artwork: ArtworkRef; onClick?: (a: ArtworkRef) => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onClick?.(artwork)}
      className="group text-left cursor-pointer"
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-secondary/30 border border-border relative">
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
        {artwork.mustSee && (
          <div className="absolute top-1.5 right-1.5">
            <Badge className="bg-amber-100/90 text-amber-800 border-amber-200 text-[0.55rem] px-1.5 py-0 h-4 backdrop-blur-sm">
              <Star className="w-2.5 h-2.5 mr-0.5" /> Must-see
            </Badge>
          </div>
        )}
      </div>
      <p className="text-xs font-medium mt-1.5 truncate text-foreground">{artwork.title}</p>
      <p className="text-[0.65rem] text-foreground/50 truncate">
        {artwork.artistTitle}
      </p>
      {artwork.galleryNumber && (
        <span className="text-[0.55rem] text-foreground/40">Gallery {artwork.galleryNumber}</span>
      )}
    </button>
  );
}

function ExhibitionList({ exhibitions }: { exhibitions: ExhibitionRef[] }) {
  if (exhibitions.length === 0) {
    return (
      <div className="text-center py-8">
        <img src={mumuLogo} alt="" className="w-10 h-10 mx-auto opacity-20 mb-3" />
        <p className="text-sm text-muted-foreground">No current exhibitions available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exhibitions.map(ex => (
        <div key={ex.id} className="p-3 bg-background border border-border rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{ex.title}</p>
            {ex.requiresAddOnTicket && (
              <Badge variant="secondary" className="text-[0.65rem] flex-shrink-0">Extra ticket</Badge>
            )}
          </div>
          {ex.shortDescription && (
            <p className="text-xs text-foreground/60 mt-1">{ex.shortDescription}</p>
          )}
          <p className="text-xs text-foreground/50 mt-1">
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
  );
}

function InfoList({ items, citations }: {
  items: Array<{ title: string; description: string }>;
  citations: Array<any>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="text-xs text-foreground/60 mt-0.5">{item.description}</p>
        </div>
      ))}
      {citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border">
          {citations.map((c: any) => <CitationChip key={c.id} citation={c} />)}
        </div>
      )}
    </div>
  );
}
