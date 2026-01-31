import { useMemo } from 'react';
import { useMuseums } from './useMuseums';
import { useVisits } from './usePassport';
import { 
  calculateAllProgress, 
  getNextToUnlock,
  type CategoryProgress,
  type TierProgress,
  type PassportStats,
} from '@/lib/achievements';

export function useAchievements() {
  const { data: museums = [] } = useMuseums();
  const { data: visits = [], isLoading } = useVisits();

  const result = useMemo(() => {
    const { categories, allTierProgress, stats } = calculateAllProgress(visits, museums);
    const nextToUnlock = getNextToUnlock(allTierProgress);

    return {
      categories,
      allTierProgress,
      stats,
      nextToUnlock,
    };
  }, [visits, museums]);

  return {
    ...result,
    isLoading,
  };
}

export type { CategoryProgress, TierProgress, PassportStats };
