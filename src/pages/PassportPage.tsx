import { useMemo, useState } from 'react';
import { useMuseums } from '@/hooks/useMuseums';
import { usePassportData } from '@/hooks/usePassportData';
import { usePreferences } from '@/hooks/usePreferences';
import { calculateAllProgress, getNextToUnlock, type CategoryProgress } from '@/lib/achievements';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Image as ImageIcon, Calendar, Trophy } from 'lucide-react';
import { PassportHero } from '@/components/passport/PassportHero';
import { YearFilter } from '@/components/passport/YearFilter';
import { PassportStats } from '@/components/passport/PassportStats';
import { MuseumsTab } from '@/components/passport/MuseumsTab';
import { ArtworksTab } from '@/components/passport/ArtworksTab';
import { ExhibitionsTab } from '@/components/passport/ExhibitionsTab';
import { PassportCard } from '@/components/passport/PassportCard';
import { AchievementWall } from '@/components/passport/AchievementWall';
import { NextToUnlock } from '@/components/passport/NextToUnlock';
import { CategoryDetailSheet } from '@/components/passport/CategoryDetailSheet';

export default function PassportPage() {
  const { preferences } = usePreferences();
  const { data: museums = [] } = useMuseums();
  const {
    passportMuseums, passportArtworks, passportExhibitions,
    countries, availableYears, isLoading,
  } = usePassportData();

  const nickname = preferences.nickname || '';
  const avatarUrl = preferences.avatar_url || '';

  const [activeTab, setActiveTab] = useState('museums');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryProgress | null>(null);

  // Passport number
  const passportNo = useMemo(() => {
    const yearStr = new Date().getFullYear().toString();
    const hash = (nickname || 'explorer').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return `MMU-${yearStr}-${String(hash % 10000).padStart(4, '0')}`;
  }, [nickname]);

  // Issue date
  const issueDate = useMemo(() => {
    const withVisits = passportMuseums.filter(m => m.visitDate);
    if (withVisits.length === 0) return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const earliest = withVisits.reduce((min, m) => (m.visitDate! < min ? m.visitDate! : min), withVisits[0].visitDate!);
    return new Date(earliest).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [passportMuseums]);

  // Home city
  const homeCity = useMemo(() => {
    return [preferences.location_city, preferences.location_region, preferences.location_country].filter(Boolean).join(', ');
  }, [preferences]);

  // Year-filtered stats
  const filteredStats = useMemo(() => {
    let ms = passportMuseums;
    let as = passportArtworks;
    if (selectedYear) {
      ms = ms.filter(m => m.latestEventDate && new Date(m.latestEventDate).getFullYear() === selectedYear);
      as = as.filter(a => a.latestEventDate && new Date(a.latestEventDate).getFullYear() === selectedYear);
    }
    const visited = ms.filter(m => m.status === 'visited' || m.status === 'completed');
    const countriesSet = new Set(visited.map(m => m.museum.country));
    const seen = as.filter(a => a.status === 'seen' || a.status === 'completed');
    const completed = ms.filter(m => m.status === 'completed');
    return {
      museumsVisited: visited.length,
      countriesVisited: countriesSet.size,
      artworksSeen: seen.length,
      completed: completed.length,
    };
  }, [passportMuseums, passportArtworks, selectedYear]);

  // Achievement data derived from passport museums
  const achievementVisits = useMemo(() => {
    return passportMuseums
      .filter(m => m.status === 'visited' || m.status === 'completed')
      .map(m => ({
        id: m.museum.museum_id,
        museum_id: m.museum.museum_id,
        visited_at: m.visitDate || new Date().toISOString(),
        notes: null,
        session_id: '',
      }));
  }, [passportMuseums]);

  const achievementData = useMemo(() => {
    const { categories, allTierProgress, stats } = calculateAllProgress(achievementVisits, museums);
    return { categories, nextToUnlock: getNextToUnlock(allTierProgress), stats };
  }, [achievementVisits, museums]);

  const tabTriggerClass = "flex items-center justify-center gap-1.5 py-3 px-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none font-display font-semibold text-xs sm:text-sm tracking-wide uppercase";

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 px-4">
        <Skeleton className="w-full h-48 rounded-lg mb-6" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
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

        {/* 2. Year Filter */}
        <YearFilter
          years={availableYears}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        {/* 3. Big Stats */}
        <PassportStats
          museumsVisited={filteredStats.museumsVisited}
          countriesVisited={filteredStats.countriesVisited}
          artworksSeen={filteredStats.artworksSeen}
          completed={filteredStats.completed}
        />

        {/* 4. Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-0 bg-transparent gap-0 border border-border rounded-sm overflow-hidden mb-4">
            <TabsTrigger value="museums" className={`${tabTriggerClass} border-r border-border`}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Museums</span>
            </TabsTrigger>
            <TabsTrigger value="artworks" className={`${tabTriggerClass} border-r border-border`}>
              <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Artworks</span>
            </TabsTrigger>
            <TabsTrigger value="exhibitions" className={`${tabTriggerClass} border-r border-border`}>
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Exhibitions</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className={tabTriggerClass}>
              <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Badges</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="museums" className="mt-0">
            <MuseumsTab
              museums={passportMuseums}
              countries={countries}
              selectedYear={selectedYear}
              selectedCountry={selectedCountry}
              onCountrySelect={setSelectedCountry}
            />
          </TabsContent>

          <TabsContent value="artworks" className="mt-0">
            <ArtworksTab
              artworks={passportArtworks}
              selectedYear={selectedYear}
            />
          </TabsContent>

          <TabsContent value="exhibitions" className="mt-0">
            <ExhibitionsTab
              exhibitions={passportExhibitions}
              selectedYear={selectedYear}
            />
          </TabsContent>

          <TabsContent value="badges" className="mt-0 space-y-5">
            <PassportCard
              stats={achievementData.stats}
              displayName={nickname || 'Explorer'}
              avatarUrl={avatarUrl}
            />
            <AchievementWall
              categories={achievementData.categories}
              onCategoryClick={cat => setSelectedCategory(cat)}
            />
            <NextToUnlock items={achievementData.nextToUnlock} />
          </TabsContent>
        </Tabs>

        {/* Category Detail Dialog */}
        <CategoryDetailSheet
          category={selectedCategory}
          open={!!selectedCategory}
          onOpenChange={open => !open && setSelectedCategory(null)}
        />
      </div>
    </ScrollArea>
  );
}
