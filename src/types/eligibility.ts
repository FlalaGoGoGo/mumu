// Eligibility types stored in user preferences (discounts field as JSON strings)

export type EligibilityType =
  | 'snap_ebt'
  | 'bofa_museums_on_us'
  | 'student'
  | 'military'
  | 'blue_star'
  | 'library_pass'
  | 'city_id'
  | 'icom'
  | 'reciprocal_museum'
  | 'science_reciprocity'
  | 'employer'
  | 'teacher'
  | 'first_responder'
  | 'senior'
  | 'local_resident';

export interface EligibilityItem {
  type: EligibilityType;
  // Optional detail arrays for types that support them
  schools?: string[];
  libraries?: string[];
  companies?: string[];
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
  hasDetails?: 'schools' | 'libraries' | 'companies';
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
    'ICOM Member': 'icom',
    'Museums for All': 'snap_ebt',
    'Military (active/veteran)': 'military',
    'None / Not sure': 'local_resident', // map to something or skip
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
  
  if (details.length > 0) {
    return `${baseLabel} — ${details.join('; ')}`;
  }
  return baseLabel;
}
