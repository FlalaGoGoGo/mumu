/**
 * Convert museum slug IDs like "detroit-institute-of-arts-detroit-us"
 * into human-readable names like "Detroit Institute of Arts"
 */

const SMALL_WORDS = new Set([
  'of', 'the', 'and', 'in', 'for', 'at', 'to', 'a', 'an', 'on', 'de', 'du', 'des', 'la', 'le', 'les',
  'von', 'van', 'der', 'den', 'het', 'di', 'del', 'della', 'delle', 'dei', 'degli',
]);

// Known suffixes that are location/country info, not part of museum name
const COUNTRY_SUFFIXES = new Set([
  'us', 'usa', 'uk', 'france', 'germany', 'italy', 'spain', 'netherlands',
  'belgium', 'austria', 'switzerland', 'japan', 'china', 'australia', 'canada',
  'russia', 'brazil', 'mexico', 'india', 'norway', 'sweden', 'denmark', 'finland',
  'czech-republic', 'hungary', 'poland', 'portugal', 'ireland', 'scotland',
]);

// Known city names that appear at end of slugs
const CITY_NAMES = new Set([
  'new-york', 'chicago', 'los-angeles', 'san-francisco', 'washington', 'boston',
  'philadelphia', 'detroit', 'paris', 'london', 'berlin', 'munich', 'vienna',
  'amsterdam', 'brussels', 'madrid', 'rome', 'florence', 'milan', 'tokyo',
  'moscow', 'saint-petersburg', 'oslo', 'stockholm', 'copenhagen', 'prague',
  'budapest', 'zurich', 'basel', 'dublin', 'edinburgh', 'glasgow', 'sydney',
  'melbourne', 'toronto', 'montreal', 'mexico-city', 'sao-paulo',
  'houston', 'dallas', 'minneapolis', 'cleveland', 'pittsburgh', 'denver',
  'seattle', 'portland', 'atlanta', 'miami', 'baltimore', 'st-louis',
  'kansas-city', 'cincinnati', 'columbus', 'indianapolis', 'milwaukee',
  'fort-worth', 'norfolk', 'richmond', 'hartford', 'new-haven', 'oberlin',
  'williamstown', 'pasadena', 'malibu', 'santa-barbara',
]);

export function humanizeMuseumId(slug: string): string {
  if (!slug) return slug;

  let parts = slug.split('-');

  // Remove trailing country code (1-2 parts)
  if (parts.length > 2) {
    const lastPart = parts[parts.length - 1];
    if (COUNTRY_SUFFIXES.has(lastPart)) {
      parts = parts.slice(0, -1);
    }
    // Check for two-part country
    if (parts.length > 2) {
      const lastTwo = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
      if (COUNTRY_SUFFIXES.has(lastTwo)) {
        parts = parts.slice(0, -2);
      }
    }
  }

  // Remove trailing city name
  if (parts.length > 2) {
    // Check single-word city
    const lastPart = parts[parts.length - 1];
    if (CITY_NAMES.has(lastPart)) {
      parts = parts.slice(0, -1);
    }
    // Check two-word city
    if (parts.length > 2) {
      const lastTwo = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
      if (CITY_NAMES.has(lastTwo)) {
        parts = parts.slice(0, -2);
      }
    }
  }

  // Title-case the remaining parts
  return parts
    .map((word, i) => {
      if (i === 0 || !SMALL_WORDS.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

/**
 * Get a display name for a museum, preferring the museumMap lookup,
 * falling back to humanized slug
 */
export function getMuseumDisplayName(
  museumId: string,
  museumMap?: Map<string, { name: string }>,
): string {
  if (museumMap) {
    const museum = museumMap.get(museumId);
    if (museum?.name) return museum.name;
  }
  return humanizeMuseumId(museumId);
}
