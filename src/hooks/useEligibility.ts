import { useMemo } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { deserializeEligibilities, EligibilityItem } from '@/types/eligibility';

/**
 * Single source of truth hook for eligibility data.
 * Reads from the same preferences store used by Settings > Discounts.
 */
export function useEligibility() {
  const { preferences, updatePreferences, isLoading } = usePreferences();

  const eligibilities = useMemo(
    () => deserializeEligibilities(preferences.discounts),
    [preferences.discounts]
  );

  const userLocations = useMemo(() => ({
    city: preferences.location_city,
    region: preferences.location_region,
    country: preferences.location_country,
  }), [preferences.location_city, preferences.location_region, preferences.location_country]);

  return {
    eligibilities,
    userLocations,
    isLoading,
    preferences,
    updatePreferences,
  };
}
