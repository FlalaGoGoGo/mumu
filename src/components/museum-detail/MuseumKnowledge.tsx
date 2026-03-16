import { useState } from 'react';
import {
  Eye, Frame, Star, Baby, Accessibility, Volume2, UtensilsCrossed,
  ShoppingBag, AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CitationChip } from './CitationChip';
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
}

export function MuseumKnowledge({ overview, knowledge, artworks, exhibitions }: MuseumKnowledgeProps) {
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
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border whitespace-nowrap transition-colors flex-shrink-0',
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
      <div className="bg-card border border-border rounded-xl p-5">
        {activeTab === 'on_view_now' && (
          <ArtworkGrid
            artworks={onView}
            emptyMessage="On-view artwork data is not available yet."
            note={`${onView.length} works currently on view from MuMu's catalog. Availability may change — check the official site for same-day confirmation.`}
          />
        )}

        {activeTab === 'must_sees' && (
          <ArtworkGrid
            artworks={mustSees}
            emptyMessage="No must-see artworks flagged yet."
            note="These are high-priority works recommended for first-time visitors."
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
              <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-accent mt-0.5">●</span> {tip}
              </p>
            ))}
          </div>
        )}

        {activeTab === 'dining' && knowledge.dining && (
          <div className="space-y-3">
            {knowledge.dining.venues.map((v, i) => (
              <div key={i} className="p-3 bg-background border border-border rounded-lg">
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{v.description}</p>
                {v.location && <p className="text-xs text-muted-foreground mt-1 italic">{v.location}</p>}
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
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
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

function ArtworkGrid({ artworks, emptyMessage, note }: {
  artworks: ArtworkRef[];
  emptyMessage: string;
  note?: string;
}) {
  if (artworks.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {note && (
        <p className="text-xs text-muted-foreground italic">{note}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {artworks.map(art => (
          <div key={art.id} className="group cursor-pointer">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
              {art.imageUrl ? (
                <img
                  src={art.imageUrl}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Frame className="w-8 h-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <p className="text-xs font-medium mt-1.5 truncate">{art.title}</p>
            <p className="text-[0.65rem] text-muted-foreground truncate">
              {art.artistTitle}
            </p>
            <div className="flex gap-1 mt-0.5">
              {art.mustSee && (
                <Badge variant="outline" className="text-[0.55rem] px-1 py-0 h-3.5 bg-amber-50 text-amber-700 border-amber-200">Must-see</Badge>
              )}
              {art.galleryNumber && (
                <span className="text-[0.55rem] text-muted-foreground">Gallery {art.galleryNumber}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExhibitionList({ exhibitions }: { exhibitions: ExhibitionRef[] }) {
  if (exhibitions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No current exhibitions available.</p>;
  }

  return (
    <div className="space-y-3">
      {exhibitions.map(ex => (
        <div key={ex.id} className="p-3 bg-background border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{ex.title}</p>
            {ex.requiresAddOnTicket && (
              <Badge variant="secondary" className="text-[0.65rem]">Extra ticket</Badge>
            )}
          </div>
          {ex.shortDescription && (
            <p className="text-xs text-muted-foreground mt-1">{ex.shortDescription}</p>
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
          <p className="text-sm font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
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
