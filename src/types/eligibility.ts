// Eligibility types stored in user preferences (discounts field as JSON strings)

export type EligibilityType =
  | 'snap_ebt'
  | 'bofa_museums_on_us'
  | 'student'
  | 'military'
  | 'blue_star'
  | 'library_pass'
  | 'city_pass'
  | 'icom'
  | 'reciprocal_museum'
  | 'science_reciprocity'
  | 'employer'
  | 'teacher'
  | 'first_responder'
  | 'local_resident'
  | 'age_based'
  | 'museum_membership';

export interface MuseumMembershipEntry {
  museum_id: string;
  museum_name: string;
  expires_on: string; // ISO date string
  lifetime?: boolean;
}

export interface ItemExpiration {
  expires_on?: string; // ISO date string
  lifetime?: boolean;
}

export interface EligibilityItem {
  type: EligibilityType;
  // Optional detail arrays for types that support them
  schools?: string[];
  libraries?: string[];
  companies?: string[];
  cities?: string[]; // For city_pass: CityPASS destination cities
  locations?: string[]; // For local_resident: "City, State, Region" strings
  date_of_birth?: string; // ISO date string for age-based eligibility
  museum_memberships?: MuseumMembershipEntry[]; // For museum_membership
  // Expiration tracking (for single-value categories)
  expires_on?: string; // ISO date string
  lifetime?: boolean;
  // Per-item expiration (for multi-item categories like schools)
  item_expirations?: Record<string, ItemExpiration>;
}

export interface EligibilityCategory {
  id: string;
  label: string;
  items: EligibilityCatalogItem[];
}

export interface EligibilityCatalogItem {
  type: EligibilityType;
  label: string;
  icon: string;
  description: string;
  hasDetails?: 'schools' | 'libraries' | 'companies' | 'date_of_birth' | 'locations' | 'cities' | 'museum_memberships';
  infoUrl?: string;
  expirationMode?: 'single' | 'per-item';
}

// Serialize eligibility items for storage in the discounts string[] field
export function serializeEligibilities(items: EligibilityItem[]): string[] {
  return items.map(item => JSON.stringify(item));
}

// Deserialize from discounts string[] field
export function deserializeEligibilities(discounts: string[]): EligibilityItem[] {
  return discounts.map(d => {
    try {
      const parsed = JSON.parse(d);
      if (parsed && typeof parsed === 'object' && parsed.type) {
        return parsed as EligibilityItem;
      }
      // Legacy format: plain string like "Student (valid ID)"
      return migrateLegacyDiscount(d);
    } catch {
      // Plain string (legacy format)
      return migrateLegacyDiscount(d);
    }
  }).filter((item): item is EligibilityItem => item !== null);
}

function migrateLegacyDiscount(value: string): EligibilityItem | null {
  const mapping: Record<string, EligibilityType> = {
    'Student (valid ID)': 'student',
    'Bank of America (Museums on Us)': 'bofa_museums_on_us',
    'Bank of America — Museums on Us': 'bofa_museums_on_us',
    'Bank of America Card Holder | Museum on US': 'bofa_museums_on_us',
    'ICOM Member': 'icom',
    'Museums for All': 'snap_ebt',
    'Military (active/veteran)': 'military',
    'CityPass': 'city_pass',
    'City ID / Local Cultural Program': 'city_pass',
    'None / Not sure': 'local_resident',
  };
  const type = mapping[value];
  if (!type || value === 'None / Not sure') return null;
  return { type };
}

// Get display label for an eligibility item
export function getEligibilityDisplayLabel(item: EligibilityItem, catalog: EligibilityCatalogItem[]): string {
  const catalogItem = catalog.find(c => c.type === item.type);
  const baseLabel = catalogItem?.label || item.type;
  
  const details: string[] = [];
  if (item.schools?.length) details.push(item.schools.join(', '));
  if (item.libraries?.length) details.push(item.libraries.join(', '));
  if (item.companies?.length) details.push(item.companies.join(', '));
  if (item.cities?.length) details.push(item.cities.join(', '));
  if (item.locations?.length) details.push(item.locations.join(', '));
  if (item.museum_memberships?.length) details.push(item.museum_memberships.map(m => m.museum_name).join(', '));
  
  if (details.length > 0) {
    return `${baseLabel} — ${details.join('; ')}`;
  }
  return baseLabel;
}
