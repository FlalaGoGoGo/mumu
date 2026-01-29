// Mapping of full US state names to two-letter codes
const STATE_NAME_TO_CODE: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
};

// Valid two-letter state codes
const VALID_STATE_CODES = new Set(Object.values(STATE_NAME_TO_CODE));

/**
 * Attempts to parse a US state code from a museum address.
 * Returns null if parsing fails or museum is not in the US.
 */
export function parseUSState(address: string | null, country: string): string | null {
  // Only process US museums
  if (!address || (country !== 'United States' && country !== 'USA' && country !== 'US')) {
    return null;
  }

  // Strategy 1: Look for comma + state abbreviation + ZIP pattern
  // e.g., "Chicago, IL 60603" or "New York, NY 10001-1234"
  const abbrevMatch = address.match(/,\s*([A-Z]{2})\s*\d{5}(-\d{4})?/);
  if (abbrevMatch && VALID_STATE_CODES.has(abbrevMatch[1])) {
    return abbrevMatch[1];
  }

  // Strategy 2: Look for state abbreviation after comma (without ZIP)
  // e.g., "Chicago, IL"
  const simpleAbbrevMatch = address.match(/,\s*([A-Z]{2})(?:\s|$|,)/);
  if (simpleAbbrevMatch && VALID_STATE_CODES.has(simpleAbbrevMatch[1])) {
    return simpleAbbrevMatch[1];
  }

  // Strategy 3: Check for full state names (case-insensitive)
  const lowerAddress = address.toLowerCase();
  for (const [stateName, stateCode] of Object.entries(STATE_NAME_TO_CODE)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${stateName}\\b`, 'i');
    if (regex.test(lowerAddress)) {
      return stateCode;
    }
  }

  return null;
}

/**
 * Get the full state name from a two-letter code
 */
export function getStateName(code: string): string {
  const entry = Object.entries(STATE_NAME_TO_CODE).find(([_, c]) => c === code);
  if (entry) {
    return entry[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return code;
}
