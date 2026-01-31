import type { Museum, UserVisit } from '@/types/museum';

// Tag types
export const MUSEUM_TAGS = ['art', 'history', 'science', 'nature', 'temple'] as const;
export type MuseumTag = typeof MUSEUM_TAGS[number];

// Tier definitions
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierDefinition {
  tier: AchievementTier;
  target: number;
  points: number;
}

export const TIER_POINTS: Record<AchievementTier, number> = {
  bronze: 10,
  silver: 20,
  gold: 40,
  platinum: 80,
};

export const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

// Achievement category definitions
export type AchievementCategory = 'museums' | 'states' | 'categories';

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  tiers: TierDefinition[];
  tag?: MuseumTag; // For per-tag achievements
}

// Museums achievement
export const MUSEUM_ACHIEVEMENT: AchievementDefinition = {
  id: 'museum_hopper',
  category: 'museums',
  name: 'Museum Hopper',
  description: 'Visit museums to unlock',
  tiers: [
    { tier: 'bronze', target: 1, points: 10 },
    { tier: 'silver', target: 5, points: 20 },
    { tier: 'gold', target: 15, points: 40 },
    { tier: 'platinum', target: 30, points: 80 },
  ],
};

// States achievement
export const STATES_ACHIEVEMENT: AchievementDefinition = {
  id: 'state_explorer',
  category: 'states',
  name: 'State Explorer',
  description: 'Visit museums in different US states',
  tiers: [
    { tier: 'bronze', target: 1, points: 10 },
    { tier: 'silver', target: 3, points: 20 },
    { tier: 'gold', target: 5, points: 40 },
    { tier: 'platinum', target: 10, points: 80 },
  ],
};

// Per-tag achievements
export const TAG_ACHIEVEMENTS: AchievementDefinition[] = MUSEUM_TAGS.map(tag => ({
  id: `${tag}_fan`,
  category: 'categories' as AchievementCategory,
  name: `${tag.charAt(0).toUpperCase() + tag.slice(1)} Fan`,
  description: `Visit ${tag} museums`,
  tag,
  tiers: [
    { tier: 'bronze', target: 1, points: 10 },
    { tier: 'silver', target: 3, points: 20 },
    { tier: 'gold', target: 8, points: 40 },
    { tier: 'platinum', target: 15, points: 80 },
  ],
}));

// Category Collector achievement
export const CATEGORY_COLLECTOR: AchievementDefinition = {
  id: 'category_collector',
  category: 'categories',
  name: 'Category Collector',
  description: 'Visit museums across all categories',
  tiers: [
    { tier: 'bronze', target: 2, points: 10 },
    { tier: 'silver', target: 3, points: 20 },
    { tier: 'gold', target: 4, points: 40 },
    { tier: 'platinum', target: 5, points: 80 },
  ],
};

// All achievements combined
export const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
  MUSEUM_ACHIEVEMENT,
  STATES_ACHIEVEMENT,
  ...TAG_ACHIEVEMENTS,
  CATEGORY_COLLECTOR,
];

// Progress tracking
export interface TierProgress {
  achievement: AchievementDefinition;
  tier: TierDefinition;
  current: number;
  target: number;
  unlocked: boolean;
  remaining: number;
}

export interface AchievementProgress {
  achievement: AchievementDefinition;
  current: number;
  tiers: TierProgress[];
  unlockedCount: number;
}

export interface CategoryProgress {
  category: AchievementCategory;
  label: string;
  achievements: AchievementProgress[];
  unlockedTiers: number;
  totalTiers: number;
}

export interface PassportStats {
  museumsVisited: number;
  statesVisited: number;
  categoriesCompleted: number;
  totalScore: number;
  starRating: number;
  completionPercent: number;
  unlockedTiers: number;
  totalTiers: number;
}

// Calculate metrics from visits and museums
export function calculateMetrics(
  visits: UserVisit[],
  museums: Museum[]
): {
  visitedCount: number;
  statesVisited: Set<string>;
  tagCounts: Record<MuseumTag, number>;
  completedTags: number;
} {
  const museumMap = new Map(museums.map(m => [m.museum_id, m]));
  const visitedMuseumIds = new Set(visits.map(v => v.museum_id));
  
  const statesVisited = new Set<string>();
  const tagCounts: Record<MuseumTag, number> = {
    art: 0,
    history: 0,
    science: 0,
    nature: 0,
    temple: 0,
  };

  visitedMuseumIds.forEach(museumId => {
    const museum = museumMap.get(museumId);
    if (!museum) return;

    // Count states (US only)
    if (museum.state && (museum.country === 'United States' || museum.country === 'USA' || museum.country === 'US')) {
      statesVisited.add(museum.state);
    }

    // Count tags
    if (museum.tags) {
      const tag = museum.tags.toLowerCase() as MuseumTag;
      if (MUSEUM_TAGS.includes(tag)) {
        tagCounts[tag]++;
      }
    }
  });

  const completedTags = MUSEUM_TAGS.filter(tag => tagCounts[tag] >= 1).length;

  return {
    visitedCount: visitedMuseumIds.size,
    statesVisited,
    tagCounts,
    completedTags,
  };
}

// Calculate progress for a single achievement
export function calculateAchievementProgress(
  achievement: AchievementDefinition,
  current: number
): AchievementProgress {
  const tiers: TierProgress[] = achievement.tiers.map(tier => ({
    achievement,
    tier,
    current: Math.min(current, tier.target),
    target: tier.target,
    unlocked: current >= tier.target,
    remaining: Math.max(0, tier.target - current),
  }));

  return {
    achievement,
    current,
    tiers,
    unlockedCount: tiers.filter(t => t.unlocked).length,
  };
}

// Calculate all achievement progress
export function calculateAllProgress(
  visits: UserVisit[],
  museums: Museum[]
): {
  categories: CategoryProgress[];
  allTierProgress: TierProgress[];
  stats: PassportStats;
} {
  const metrics = calculateMetrics(visits, museums);

  // Calculate museum achievement
  const museumProgress = calculateAchievementProgress(MUSEUM_ACHIEVEMENT, metrics.visitedCount);

  // Calculate states achievement
  const statesProgress = calculateAchievementProgress(STATES_ACHIEVEMENT, metrics.statesVisited.size);

  // Calculate tag achievements
  const tagProgressList = TAG_ACHIEVEMENTS.map(achievement => {
    const tag = achievement.tag as MuseumTag;
    return calculateAchievementProgress(achievement, metrics.tagCounts[tag]);
  });

  // Calculate category collector
  const collectorProgress = calculateAchievementProgress(CATEGORY_COLLECTOR, metrics.completedTags);

  // Group by category
  const categories: CategoryProgress[] = [
    {
      category: 'museums',
      label: 'Museums',
      achievements: [museumProgress],
      unlockedTiers: museumProgress.unlockedCount,
      totalTiers: museumProgress.tiers.length,
    },
    {
      category: 'states',
      label: 'States',
      achievements: [statesProgress],
      unlockedTiers: statesProgress.unlockedCount,
      totalTiers: statesProgress.tiers.length,
    },
    {
      category: 'categories',
      label: 'Categories',
      achievements: [...tagProgressList, collectorProgress],
      unlockedTiers: tagProgressList.reduce((acc, p) => acc + p.unlockedCount, 0) + collectorProgress.unlockedCount,
      totalTiers: tagProgressList.reduce((acc, p) => acc + p.tiers.length, 0) + collectorProgress.tiers.length,
    },
  ];

  // Flatten all tier progress
  const allTierProgress: TierProgress[] = [
    ...museumProgress.tiers,
    ...statesProgress.tiers,
    ...tagProgressList.flatMap(p => p.tiers),
    ...collectorProgress.tiers,
  ];

  // Calculate stats
  const unlockedTiers = allTierProgress.filter(t => t.unlocked).length;
  const totalTiers = allTierProgress.length;
  const totalScore = allTierProgress
    .filter(t => t.unlocked)
    .reduce((acc, t) => acc + t.tier.points, 0);

  // Star rating based on score
  let starRating = 0;
  if (totalScore >= 800) starRating = 5;
  else if (totalScore >= 500) starRating = 4;
  else if (totalScore >= 300) starRating = 3;
  else if (totalScore >= 150) starRating = 2;
  else if (totalScore >= 50) starRating = 1;

  const stats: PassportStats = {
    museumsVisited: metrics.visitedCount,
    statesVisited: metrics.statesVisited.size,
    categoriesCompleted: metrics.completedTags,
    totalScore,
    starRating,
    completionPercent: totalTiers > 0 ? (unlockedTiers / totalTiers) * 100 : 0,
    unlockedTiers,
    totalTiers,
  };

  return { categories, allTierProgress, stats };
}

// Get next achievements to unlock (closest to completion)
export function getNextToUnlock(allTierProgress: TierProgress[], limit = 3): TierProgress[] {
  return allTierProgress
    .filter(t => !t.unlocked && t.remaining > 0)
    .sort((a, b) => {
      // Sort by remaining (ascending), then by target (ascending for tie-breaker)
      if (a.remaining !== b.remaining) return a.remaining - b.remaining;
      return a.target - b.target;
    })
    .slice(0, limit);
}
