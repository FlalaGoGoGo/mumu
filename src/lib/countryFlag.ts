// Comprehensive map of country names to ISO 3166-1 alpha-2 codes
const countryNameToCode: Record<string, string> = {
  // A
  'afghanistan': 'AF', 'albania': 'AL', 'algeria': 'DZ', 'andorra': 'AD',
  'angola': 'AO', 'antigua and barbuda': 'AG', 'argentina': 'AR', 'armenia': 'AM',
  'australia': 'AU', 'austria': 'AT', 'azerbaijan': 'AZ',
  // B
  'bahamas': 'BS', 'bahrain': 'BH', 'bangladesh': 'BD', 'barbados': 'BB',
  'belarus': 'BY', 'belgium': 'BE', 'belize': 'BZ', 'benin': 'BJ',
  'bhutan': 'BT', 'bolivia': 'BO', 'bosnia and herzegovina': 'BA', 'bosnia': 'BA',
  'botswana': 'BW', 'brazil': 'BR', 'brunei': 'BN', 'bulgaria': 'BG',
  'burkina faso': 'BF', 'burundi': 'BI',
  // C
  'cambodia': 'KH', 'cameroon': 'CM', 'canada': 'CA', 'cape verde': 'CV',
  'central african republic': 'CF', 'chad': 'TD', 'chile': 'CL', 'china': 'CN',
  'colombia': 'CO', 'comoros': 'KM', 'congo': 'CG',
  'democratic republic of the congo': 'CD', 'costa rica': 'CR', 'croatia': 'HR',
  'cuba': 'CU', 'cyprus': 'CY', 'czech republic': 'CZ', 'czechia': 'CZ',
  // D
  'denmark': 'DK', 'djibouti': 'DJ', 'dominica': 'DM', 'dominican republic': 'DO',
  // E
  'ecuador': 'EC', 'egypt': 'EG', 'el salvador': 'SV', 'equatorial guinea': 'GQ',
  'eritrea': 'ER', 'estonia': 'EE', 'eswatini': 'SZ', 'ethiopia': 'ET',
  // F
  'fiji': 'FJ', 'finland': 'FI', 'france': 'FR',
  // G
  'gabon': 'GA', 'gambia': 'GM', 'georgia': 'GE', 'germany': 'DE',
  'ghana': 'GH', 'greece': 'GR', 'grenada': 'GD', 'guatemala': 'GT',
  'guinea': 'GN', 'guinea-bissau': 'GW', 'guyana': 'GY',
  // H
  'haiti': 'HT', 'honduras': 'HN', 'hungary': 'HU',
  // I
  'iceland': 'IS', 'india': 'IN', 'indonesia': 'ID', 'iran': 'IR',
  'iraq': 'IQ', 'ireland': 'IE', 'israel': 'IL', 'italy': 'IT',
  'ivory coast': 'CI', "cote d'ivoire": 'CI',
  // J
  'jamaica': 'JM', 'japan': 'JP', 'jordan': 'JO',
  // K
  'kazakhstan': 'KZ', 'kenya': 'KE', 'kiribati': 'KI', 'kuwait': 'KW',
  'kyrgyzstan': 'KG', 'north korea': 'KP', 'south korea': 'KR', 'korea': 'KR',
  // L
  'laos': 'LA', 'latvia': 'LV', 'lebanon': 'LB', 'lesotho': 'LS',
  'liberia': 'LR', 'libya': 'LY', 'liechtenstein': 'LI', 'lithuania': 'LT',
  'luxembourg': 'LU',
  // M
  'madagascar': 'MG', 'malawi': 'MW', 'malaysia': 'MY', 'maldives': 'MV',
  'mali': 'ML', 'malta': 'MT', 'marshall islands': 'MH', 'mauritania': 'MR',
  'mauritius': 'MU', 'mexico': 'MX', 'micronesia': 'FM', 'moldova': 'MD',
  'monaco': 'MC', 'mongolia': 'MN', 'montenegro': 'ME', 'morocco': 'MA',
  'mozambique': 'MZ', 'myanmar': 'MM', 'burma': 'MM',
  // N
  'namibia': 'NA', 'nauru': 'NR', 'nepal': 'NP', 'netherlands': 'NL',
  'the netherlands': 'NL', 'holland': 'NL', 'new zealand': 'NZ',
  'nicaragua': 'NI', 'niger': 'NE', 'nigeria': 'NG', 'north macedonia': 'MK',
  'macedonia': 'MK', 'norway': 'NO',
  // O
  'oman': 'OM',
  // P
  'pakistan': 'PK', 'palau': 'PW', 'palestine': 'PS', 'panama': 'PA',
  'papua new guinea': 'PG', 'paraguay': 'PY', 'peru': 'PE', 'philippines': 'PH',
  'poland': 'PL', 'portugal': 'PT',
  // Q
  'qatar': 'QA',
  // R
  'romania': 'RO', 'russia': 'RU', 'rwanda': 'RW',
  // S
  'saint kitts and nevis': 'KN', 'saint lucia': 'LC',
  'saint vincent and the grenadines': 'VC', 'samoa': 'WS',
  'san marino': 'SM', 'sao tome and principe': 'ST', 'saudi arabia': 'SA',
  'senegal': 'SN', 'serbia': 'RS', 'seychelles': 'SC', 'sierra leone': 'SL',
  'singapore': 'SG', 'slovakia': 'SK', 'slovenia': 'SI', 'solomon islands': 'SB',
  'somalia': 'SO', 'south africa': 'ZA', 'south sudan': 'SS', 'spain': 'ES',
  'sri lanka': 'LK', 'sudan': 'SD', 'suriname': 'SR', 'sweden': 'SE',
  'switzerland': 'CH', 'syria': 'SY',
  // T
  'taiwan': 'TW', 'tajikistan': 'TJ', 'tanzania': 'TZ', 'thailand': 'TH',
  'timor-leste': 'TL', 'togo': 'TG', 'tonga': 'TO',
  'trinidad and tobago': 'TT', 'tunisia': 'TN', 'turkey': 'TR', 'türkiye': 'TR',
  'turkmenistan': 'TM', 'tuvalu': 'TV',
  // U
  'uganda': 'UG', 'ukraine': 'UA', 'united arab emirates': 'AE', 'uae': 'AE',
  'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB',
  'united states': 'US', 'usa': 'US', 'u.s.': 'US', 'u.s.a.': 'US',
  'uruguay': 'UY', 'uzbekistan': 'UZ',
  // V
  'vanuatu': 'VU', 'vatican city': 'VA', 'venezuela': 'VE', 'vietnam': 'VN',
  // Y
  'yemen': 'YE',
  // Z
  'zambia': 'ZM', 'zimbabwe': 'ZW',

  // Common demonyms / nationalities
  'american': 'US', 'french': 'FR', 'british': 'GB', 'english': 'GB',
  'german': 'DE', 'italian': 'IT', 'spanish': 'ES', 'dutch': 'NL',
  'belgian': 'BE', 'austrian': 'AT', 'swiss': 'CH', 'japanese': 'JP',
  'chinese': 'CN', 'korean': 'KR', 'south korean': 'KR', 'australian': 'AU',
  'canadian': 'CA', 'mexican': 'MX', 'brazilian': 'BR', 'russian': 'RU',
  'indian': 'IN', 'egyptian': 'EG', 'greek': 'GR', 'portuguese': 'PT',
  'irish': 'IE', 'scottish': 'GB', 'welsh': 'GB', 'swedish': 'SE',
  'norwegian': 'NO', 'danish': 'DK', 'finnish': 'FI', 'polish': 'PL',
  'czech': 'CZ', 'hungarian': 'HU', 'turkish': 'TR', 'israeli': 'IL',
  'taiwanese': 'TW', 'singaporean': 'SG', 'thai': 'TH', 'vietnamese': 'VN',
  'indonesian': 'ID', 'malaysian': 'MY', 'filipino': 'PH',
  'new zealander': 'NZ', 'argentine': 'AR', 'argentinian': 'AR',
  'chilean': 'CL', 'colombian': 'CO', 'peruvian': 'PE',
  'south african': 'ZA', 'moroccan': 'MA', 'emirati': 'AE',
  'qatari': 'QA', 'saudi': 'SA',
};

/**
 * Convert ISO 3166-1 alpha-2 country code to flag emoji
 */
function isoCodeToFlag(isoCode: string): string {
  const code = isoCode.toUpperCase();
  if (code.length !== 2) return '';
  const offset = 127397;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
}

/**
 * Get flag emoji for a country name or ISO code.
 * Returns 🌍 globe if country cannot be determined.
 */
export function getCountryFlag(country: string | null | undefined): string {
  if (!country) return '🌍';

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

  // Fallback to globe icon
  return '🌍';
}
