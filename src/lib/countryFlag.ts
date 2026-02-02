// Map country names to ISO 3166-1 alpha-2 codes
const countryNameToCode: Record<string, string> = {
  'united states': 'US',
  'usa': 'US',
  'u.s.': 'US',
  'u.s.a.': 'US',
  'france': 'FR',
  'united kingdom': 'GB',
  'uk': 'GB',
  'england': 'GB',
  'germany': 'DE',
  'italy': 'IT',
  'spain': 'ES',
  'netherlands': 'NL',
  'the netherlands': 'NL',
  'holland': 'NL',
  'belgium': 'BE',
  'austria': 'AT',
  'switzerland': 'CH',
  'japan': 'JP',
  'china': 'CN',
  'south korea': 'KR',
  'korea': 'KR',
  'australia': 'AU',
  'canada': 'CA',
  'mexico': 'MX',
  'brazil': 'BR',
  'russia': 'RU',
  'india': 'IN',
  'egypt': 'EG',
  'greece': 'GR',
  'portugal': 'PT',
  'ireland': 'IE',
  'scotland': 'GB',
  'wales': 'GB',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'poland': 'PL',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'hungary': 'HU',
  'turkey': 'TR',
  'israel': 'IL',
  'taiwan': 'TW',
  'singapore': 'SG',
  'thailand': 'TH',
  'vietnam': 'VN',
  'indonesia': 'ID',
  'malaysia': 'MY',
  'philippines': 'PH',
  'new zealand': 'NZ',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'south africa': 'ZA',
  'morocco': 'MA',
  'uae': 'AE',
  'united arab emirates': 'AE',
  'qatar': 'QA',
  'saudi arabia': 'SA',
};

/**
 * Convert ISO 3166-1 alpha-2 country code to flag emoji
 * Uses regional indicator symbols (🇦-🇿)
 */
function isoCodeToFlag(isoCode: string): string {
  const code = isoCode.toUpperCase();
  if (code.length !== 2) return '';
  
  const offset = 127397; // Regional indicator symbol offset
  const first = code.charCodeAt(0) + offset;
  const second = code.charCodeAt(1) + offset;
  
  return String.fromCodePoint(first, second);
}

/**
 * Get flag emoji for a country name or ISO code
 * Returns a default icon if country cannot be determined
 */
export function getCountryFlag(country: string | null | undefined): string {
  if (!country) return '🏛️';
  
  const trimmed = country.trim();
  
  // Check if it's already a 2-letter ISO code
  if (trimmed.length === 2 && /^[A-Za-z]{2}$/.test(trimmed)) {
    return isoCodeToFlag(trimmed);
  }
  
  // Try to find the country name in our mapping
  const normalized = trimmed.toLowerCase();
  const isoCode = countryNameToCode[normalized];
  
  if (isoCode) {
    return isoCodeToFlag(isoCode);
  }
  
  // Fallback to default museum icon
  return '🏛️';
}
