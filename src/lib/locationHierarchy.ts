import type { Museum } from '@/types/museum';

export interface LocationNode {
  regions: string[];
  countries: Map<string, string[]>; // region -> countries
  states: Map<string, string[]>; // country -> states
  cities: Map<string, string[]>; // state (or country if no state) -> cities
}

export function buildLocationHierarchy(museums: Museum[]): LocationNode {
  const regionSet = new Set<string>();
  const countryToRegion = new Map<string, string>();
  const countryStates = new Map<string, Set<string>>();
  const stateCities = new Map<string, Set<string>>();
  const countryCities = new Map<string, Set<string>>();

  // Derive region from country
  function getRegion(country: string): string {
    const regionMap: Record<string, string> = {
      'United States': 'North America',
      'Canada': 'North America',
      'Mexico': 'North America',
      'United Kingdom': 'Europe',
      'France': 'Europe',
      'Germany': 'Europe',
      'Italy': 'Europe',
      'Spain': 'Europe',
      'Netherlands': 'Europe',
      'Austria': 'Europe',
      'Switzerland': 'Europe',
      'Belgium': 'Europe',
      'Denmark': 'Europe',
      'Sweden': 'Europe',
      'Norway': 'Europe',
      'Finland': 'Europe',
      'Ireland': 'Europe',
      'Portugal': 'Europe',
      'Greece': 'Europe',
      'Czech Republic': 'Europe',
      'Poland': 'Europe',
      'Hungary': 'Europe',
      'Russia': 'Europe',
      'Turkey': 'Europe',
      'Japan': 'Asia',
      'China': 'Asia',
      'South Korea': 'Asia',
      'India': 'Asia',
      'Taiwan': 'Asia',
      'Thailand': 'Asia',
      'Singapore': 'Asia',
      'Indonesia': 'Asia',
      'Malaysia': 'Asia',
      'Vietnam': 'Asia',
      'Philippines': 'Asia',
      'Israel': 'Asia',
      'Australia': 'Oceania',
      'New Zealand': 'Oceania',
      'Brazil': 'South America',
      'Argentina': 'South America',
      'Colombia': 'South America',
      'Chile': 'South America',
      'Peru': 'South America',
      'Egypt': 'Africa',
      'South Africa': 'Africa',
      'Morocco': 'Africa',
      'Nigeria': 'Africa',
      'Kenya': 'Africa',
      'UAE': 'Middle East',
      'Qatar': 'Middle East',
      'Saudi Arabia': 'Middle East',
    };
    return regionMap[country] || 'Other';
  }

  for (const m of museums) {
    const region = getRegion(m.country);
    regionSet.add(region);
    countryToRegion.set(m.country, region);

    if (!countryStates.has(m.country)) countryStates.set(m.country, new Set());
    if (m.state) {
      countryStates.get(m.country)!.add(m.state);
      const stateKey = `${m.country}::${m.state}`;
      if (!stateCities.has(stateKey)) stateCities.set(stateKey, new Set());
      stateCities.get(stateKey)!.add(m.city);
    } else {
      if (!countryCities.has(m.country)) countryCities.set(m.country, new Set());
      countryCities.get(m.country)!.add(m.city);
    }
  }

  const regions = [...regionSet].sort();
  const countries = new Map<string, string[]>();
  for (const region of regions) {
    const cs = [...countryToRegion.entries()]
      .filter(([, r]) => r === region)
      .map(([c]) => c)
      .sort();
    countries.set(region, [...new Set(cs)]);
  }

  const states = new Map<string, string[]>();
  for (const [country, ss] of countryStates) {
    states.set(country, [...ss].sort());
  }

  const cities = new Map<string, string[]>();
  for (const [key, cs] of stateCities) {
    cities.set(key, [...cs].sort());
  }
  for (const [country, cs] of countryCities) {
    cities.set(country, [...cs].sort());
  }

  return { regions, countries, states, cities };
}

export function getCitiesForStop(
  hierarchy: LocationNode,
  country?: string,
  state?: string
): string[] {
  if (state && country) {
    return hierarchy.cities.get(`${country}::${state}`) || [];
  }
  if (country) {
    // Merge all cities for this country
    const allCities = new Set<string>();
    const states = hierarchy.states.get(country) || [];
    for (const s of states) {
      const cs = hierarchy.cities.get(`${country}::${s}`) || [];
      cs.forEach(c => allCities.add(c));
    }
    const directCities = hierarchy.cities.get(country) || [];
    directCities.forEach(c => allCities.add(c));
    return [...allCities].sort();
  }
  return [];
}
