import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMuseums } from '@/hooks/useMuseums';
import { useVisits, useHighlightCompletions, useRemoveVisit } from '@/hooks/usePassport';
import { useAicHighlights } from '@/hooks/useHighlights';
import { useSavedMuseums } from '@/hooks/useSavedMuseums';
import { useAchievements } from '@/hooks/useAchievements';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Check, Trash2, Image as ImageIcon, Flag, Info, Heart, Trophy, ExternalLink, Map as MapIcon } from 'lucide-react';
import { parseUSState } from '@/lib/parseUSState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PassportCard } from '@/components/passport/PassportCard';
import { AchievementWall } from '@/components/passport/AchievementWall';
import { CategoryDetailSheet } from '@/components/passport/CategoryDetailSheet';
import { NextToUnlock } from '@/components/passport/NextToUnlock';
import type { CategoryProgress } from '@/lib/achievements';

export default function PassportPage() {
  const navigate = useNavigate();
  const { data: museums = [] } = useMuseums();
  const { data: visits = [], isLoading: visitsLoading } = useVisits();
  const { data: completions = [] } = useHighlightCompletions();
  const { data: highlights = [] } = useAicHighlights();
  const removeVisit = useRemoveVisit();
  const { savedMuseums, savedCount, removeMuseum } = useSavedMuseums();
  const { categories, nextToUnlock, stats } = useAchievements();

  const [activeTab, setActiveTab] = useState('visited');
  const [selectedCategory, setSelectedCategory] = useState<CategoryProgress | null>(null);

  const museumMap = new Map(museums.map(m => [m.museum_id, m]));
  const highlightMap = new Map(highlights.map(h => [h.artic_id, h]));

  const completedHighlights = completions
    .map(c => highlightMap.get(c.artic_id))
    .filter(Boolean);

  // Compute unique US states visited
  const { uniqueStates, hasUnparsableAddresses } = useMemo(() => {
    const states = new Set<string>();
    let unparsable = false;
    
    for (const visit of visits) {
      const museum = museumMap.get(visit.museum_id);
      if (!museum) continue;
      
      // Only try to parse US museums
      if (museum.country === 'United States' || museum.country === 'USA' || museum.country === 'US') {
        const stateCode = parseUSState(museum.address, museum.country);
        if (stateCode) {
          states.add(stateCode);
        } else {
          unparsable = true;
        }
      }
    }
    
    return { uniqueStates: states, hasUnparsableAddresses: unparsable };
  }, [visits, museumMap]);

  const statesCount = uniqueStates.size;

  if (visitsLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="w-48 h-8 mb-6" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-80px)] md:h-[calc(100vh-73px)]">
      <div className="container max-w-4xl py-6 md:py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            My Passport
          </h1>
          <p className="text-muted-foreground">
            Track your museum visits and artwork discoveries
          </p>
        </div>

        {/* Dashboard KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="gallery-card text-center">
            <div className="font-display text-2xl md:text-3xl font-bold text-primary mb-1">
              {visits.length}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" />
              Museums Visited
            </div>
          </div>
          <div className="gallery-card text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <div className="font-display text-2xl md:text-3xl font-bold text-secondary mb-1 flex items-center justify-center gap-1">
                      {statesCount}
                      {hasUnparsableAddresses && (
                        <Info className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Flag className="w-3 h-3" />
                      US States
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    {hasUnparsableAddresses 
                      ? "Some museums don't include state info in their address, so count may be undercounted."
                      : "Unique US states where you've visited museums."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="gallery-card text-center">
            <div className="font-display text-2xl md:text-3xl font-bold text-accent mb-1">
              {completions.length}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
              <ImageIcon className="w-3 h-3" />
              Artworks Seen
            </div>
          </div>
          <div className="gallery-card text-center">
            <div className="font-display text-2xl md:text-3xl font-bold text-red-500 mb-1">
              {savedCount}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Heart className="w-3 h-3" />
              Saved Museums
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4 h-auto p-1 gap-0">
            <TabsTrigger 
              value="visited" 
              className="flex items-center justify-center gap-1.5 py-2.5 px-1 border-r border-border/50 rounded-none first:rounded-l-md data-[state=active]:rounded-sm"
            >
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Visited</span>
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="flex items-center justify-center gap-1.5 py-2.5 px-1 border-r border-border/50 rounded-none data-[state=active]:rounded-sm"
            >
              <Heart className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Saved</span>
            </TabsTrigger>
            <TabsTrigger 
              value="artworks" 
              className="flex items-center justify-center gap-1.5 py-2.5 px-1 border-r border-border/50 rounded-none data-[state=active]:rounded-sm"
            >
              <ImageIcon className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Artworks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-none last:rounded-r-md data-[state=active]:rounded-sm"
            >
              <Trophy className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Achievements</span>
            </TabsTrigger>
          </TabsList>

          {/* Visited Museums Tab */}
          <TabsContent value="visited" className="mt-0">
            {visits.length === 0 ? (
              <div className="gallery-card text-center py-8">
                <div className="passport-stamp mx-auto mb-4">
                  <span>Empty</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  No museums visited yet. Start exploring!
                </p>
                <Button onClick={() => navigate('/')}>
                  <MapIcon className="w-4 h-4 mr-2" />
                  Go to Map
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visits.map((visit) => {
                  const museum = museumMap.get(visit.museum_id);
                  if (!museum) return null;
                  
                  return (
                    <div key={visit.id} className="gallery-card flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full border-2 border-primary/30 flex-shrink-0 overflow-hidden bg-background">
                        {museum.hero_image_url ? (
                          <img 
                            src={museum.hero_image_url} 
                            alt={museum.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold truncate">
                          {museum.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {museum.city}, {museum.country}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {new Date(visit.visited_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeVisit.mutate(museum.museum_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Saved Museums Tab */}
          <TabsContent value="saved" className="mt-0">
            {savedMuseums.length === 0 ? (
              <div className="gallery-card text-center py-8">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  No saved museums yet. Tap the heart icon on any museum to save it!
                </p>
                <Button onClick={() => navigate('/')}>
                  <MapIcon className="w-4 h-4 mr-2" />
                  Go to Map
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {savedMuseums.map((saved) => (
                  <div key={saved.museum_id} className="gallery-card flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden bg-muted">
                      {saved.image_url ? (
                        <img 
                          src={saved.image_url} 
                          alt={saved.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-red-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold truncate">
                        {saved.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {saved.city}{saved.state ? `, ${saved.state}` : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {saved.website_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            asChild
                          >
                            <a href={saved.website_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Website
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => navigate('/')}
                        >
                          <MapIcon className="w-3 h-3 mr-1" />
                          Map
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeMuseum(saved.museum_id)}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Artworks Tab */}
          <TabsContent value="artworks" className="mt-0">
            {completedHighlights.length === 0 ? (
              <div className="gallery-card text-center py-8">
                <div className="passport-stamp mx-auto mb-4">
                  <span>Empty</span>
                </div>
                <p className="text-muted-foreground mb-4">
                  No artworks marked yet. Visit the Plan page to start!
                </p>
                <Button onClick={() => navigate('/plan')}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  View Plan
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-0">
                {completedHighlights.map((highlight) => (
                  <div 
                    key={highlight!.artic_id} 
                    className="group relative aspect-square overflow-hidden cursor-pointer"
                  >
                    {highlight!.image_url ? (
                      <img
                        src={highlight!.image_url}
                        alt={highlight!.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                      <h3 className="font-display text-xs font-semibold text-white leading-tight line-clamp-2">
                        {highlight!.title}
                      </h3>
                      {highlight!.artist && (
                        <p className="text-[10px] text-white/80 truncate mt-0.5">
                          {highlight!.artist}
                        </p>
                      )}
                      {highlight!.year && (
                        <p className="text-[10px] text-white/60 truncate">
                          {highlight!.year}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-0 space-y-6">
            {/* Passport Card */}
            <PassportCard stats={stats} displayName="Explorer" />
            
            {/* Achievement Wall */}
            <AchievementWall 
              categories={categories} 
              onCategoryClick={(cat) => setSelectedCategory(cat)} 
            />
            
            {/* Next to Unlock */}
            <NextToUnlock items={nextToUnlock} />
            
            {/* Category Detail Sheet */}
            <CategoryDetailSheet 
              category={selectedCategory}
              open={!!selectedCategory}
              onOpenChange={(open) => !open && setSelectedCategory(null)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
