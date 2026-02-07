import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMuseums } from '@/hooks/useMuseums';
import { useVisits, useRemoveVisit } from '@/hooks/usePassport';
import { useEnrichedArtworks } from '@/hooks/useArtworks';
import { useCollectedArtworks } from '@/hooks/useCollectedArtworks';
import { useSavedMuseums } from '@/hooks/useSavedMuseums';
import { useAchievements } from '@/hooks/useAchievements';
import { usePreferences } from '@/hooks/usePreferences';
import { useLanguage } from '@/lib/i18n';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Heart, Image as ImageIcon, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PassportHero } from '@/components/passport/PassportHero';
import { PassportWorldMap } from '@/components/passport/PassportWorldMap';
import { PassportStats } from '@/components/passport/PassportStats';
import { YearFilter } from '@/components/passport/YearFilter';
import { StampTimeline } from '@/components/passport/StampTimeline';
import { WishListTab } from '@/components/passport/WishListTab';
import { ArtworkShelf } from '@/components/passport/ArtworkShelf';
import { AchievementWall } from '@/components/passport/AchievementWall';
import { CategoryDetailSheet } from '@/components/passport/CategoryDetailSheet';
import { NextToUnlock } from '@/components/passport/NextToUnlock';
import { PassportCard } from '@/components/passport/PassportCard';
import { getArtworkImageUrl } from '@/types/art';
import type { CategoryProgress } from '@/lib/achievements';

export default function PassportPage() {
  const navigate = useNavigate();
  const { t, tp } = useLanguage();
  const { data: museums = [] } = useMuseums();
  const { data: visits = [], isLoading: visitsLoading } = useVisits();
  const { data: enrichedArtworks = [] } = useEnrichedArtworks();
  const { collectedArtworks, collectedCount, removeArtwork } = useCollectedArtworks();
  const removeVisit = useRemoveVisit();
  const { savedMuseums, savedCount, removeMuseum } = useSavedMuseums();
  const { categories, nextToUnlock, stats } = useAchievements();
  const { preferences } = usePreferences();

  const nickname = preferences.nickname || '';
  const avatarUrl = preferences.avatar_url || '';

  const [activeTab, setActiveTab] = useState('visited');
  const [selectedCategory, setSelectedCategory] = useState<CategoryProgress | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const museumMap = useMemo(() => new Map(museums.map((m) => [m.museum_id, m])), [museums]);

  // Collected artwork lookup
  const collectedIds = useMemo(
    () => new Set(collectedArtworks.map((a) => a.artwork_id)),
    [collectedArtworks]
  );
  const collectedEnrichedArtworks = useMemo(
    () => enrichedArtworks.filter((a) => collectedIds.has(a.artwork_id)),
    [enrichedArtworks, collectedIds]
  );

  // Extract years from visits
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    visits.forEach((v) => {
      const year = new Date(v.visited_at).getFullYear();
      if (!isNaN(year)) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [visits]);

  // Filter visits by year
  const filteredVisits = useMemo(() => {
    if (!selectedYear) return visits;
    return visits.filter(
      (v) => new Date(v.visited_at).getFullYear() === selectedYear
    );
  }, [visits, selectedYear]);

  // Visited museums with location data
  const visitedMuseums = useMemo(() => {
    const ids = new Set(filteredVisits.map((v) => v.museum_id));
    return museums.filter((m) => ids.has(m.museum_id));
  }, [filteredVisits, museums]);

  // Visit dates map
  const visitDates = useMemo(() => {
    const map = new Map<string, string>();
    filteredVisits.forEach((v) => map.set(v.museum_id, v.visited_at));
    return map;
  }, [filteredVisits]);

  // Countries visited
  const countries = useMemo(() => {
    const set = new Set(visitedMuseums.map((m) => m.country));
    return Array.from(set).sort();
  }, [visitedMuseums]);

  // Artwork count by museum
  const artworkCountByMuseum = useMemo(() => {
    const map = new Map<string, number>();
    collectedEnrichedArtworks.forEach((a) => {
      map.set(a.museum_id, (map.get(a.museum_id) || 0) + 1);
    });
    return map;
  }, [collectedEnrichedArtworks]);

  // Filter artworks by year if applicable
  const filteredArtworks = useMemo(() => {
    if (!selectedYear) return collectedEnrichedArtworks;
    return collectedEnrichedArtworks; // Artworks don't have a date, show all
  }, [collectedEnrichedArtworks, selectedYear]);

  // Passport number
  const passportNo = useMemo(() => {
    const yearStr = new Date().getFullYear().toString();
    const hash = (preferences.nickname || 'explorer')
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const num = String(hash % 10000).padStart(4, '0');
    return `MMU-${yearStr}-${num}`;
  }, [preferences.nickname]);

  // Issue date
  const issueDate = useMemo(() => {
    if (visits.length === 0) return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const earliest = visits.reduce((min, v) =>
      v.visited_at < min ? v.visited_at : min, visits[0].visited_at
    );
    return new Date(earliest).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [visits]);

  // Home city
  const homeCity = useMemo(() => {
    const parts = [preferences.location_city, preferences.location_region, preferences.location_country]
      .filter(Boolean);
    return parts.join(', ');
  }, [preferences]);

  if (visitsLoading) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <Skeleton className="w-full h-48 rounded-lg mb-6" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-80px)] md:h-[calc(100vh-73px)]">
      <div className="container max-w-4xl py-4 md:py-6 px-4 space-y-5">
        {/* 1. Passport Hero */}
        <PassportHero
          displayName={nickname}
          avatarUrl={avatarUrl}
          passportNo={passportNo}
          issueDate={issueDate}
          homeCity={homeCity}
        />

        {/* 2. World Map */}
        <PassportWorldMap
          visitedMuseums={visitedMuseums}
          visitDates={visitDates}
          countries={countries}
          selectedCountry={selectedCountry}
          onCountrySelect={setSelectedCountry}
        />

        {/* 3. Year Filter */}
        <YearFilter
          years={availableYears}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        {/* 4. Big Stats */}
        <PassportStats
          museumsVisited={visitedMuseums.length}
          countriesVisited={countries.length}
          artworksSeen={collectedCount}
          wishlistCompleted={0}
        />

        {/* 5. Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-0 bg-transparent gap-0 border border-border rounded-sm overflow-hidden mb-4">
            <TabsTrigger
              value="visited"
              className="flex items-center justify-center gap-1.5 py-3 px-1 rounded-none border-r border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none font-display font-semibold text-xs sm:text-sm tracking-wide uppercase"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Visited</span>
            </TabsTrigger>
            <TabsTrigger
              value="wishlist"
              className="flex items-center justify-center gap-1.5 py-3 px-1 rounded-none border-r border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none font-display font-semibold text-xs sm:text-sm tracking-wide uppercase"
            >
              <Heart className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Wish List</span>
            </TabsTrigger>
            <TabsTrigger
              value="artworks"
              className="flex items-center justify-center gap-1.5 py-3 px-1 rounded-none border-r border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none font-display font-semibold text-xs sm:text-sm tracking-wide uppercase"
            >
              <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Artworks</span>
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="flex items-center justify-center gap-1.5 py-3 px-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none font-display font-semibold text-xs sm:text-sm tracking-wide uppercase"
            >
              <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Badges</span>
            </TabsTrigger>
          </TabsList>

          {/* Visited Tab */}
          <TabsContent value="visited" className="mt-0">
            <StampTimeline
              visits={filteredVisits}
              museumMap={museumMap}
              artworkCountByMuseum={artworkCountByMuseum}
              onRemoveVisit={(id) => removeVisit.mutate(id)}
            />
          </TabsContent>

          {/* Wish List Tab */}
          <TabsContent value="wishlist" className="mt-0">
            <WishListTab
              savedMuseums={savedMuseums}
              onRemoveMuseum={removeMuseum}
            />
          </TabsContent>

          {/* Artworks Tab */}
          <TabsContent value="artworks" className="mt-0">
            <ArtworkShelf
              artworks={filteredArtworks}
              onRemoveArtwork={removeArtwork}
            />
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-0 space-y-5">
            <PassportCard
              stats={stats}
              displayName={nickname || 'Explorer'}
              avatarUrl={avatarUrl}
            />
            <AchievementWall
              categories={categories}
              onCategoryClick={(cat) => setSelectedCategory(cat)}
            />
            <NextToUnlock items={nextToUnlock} />
          </TabsContent>
        </Tabs>

        {/* Category Detail Dialog */}
        <CategoryDetailSheet
          category={selectedCategory}
          open={!!selectedCategory}
          onOpenChange={(open) => !open && setSelectedCategory(null)}
        />
      </div>
    </ScrollArea>
  );
}
