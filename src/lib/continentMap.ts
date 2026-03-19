/**
 * Maps country names (and common sub-national values found in museum data) to continents.
 * Covers all sovereign nations + territories + known data anomalies (US states, JP cities, etc.)
 */

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  // ── North America ──
  'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
  'Cuba': 'North America', 'Jamaica': 'North America', 'Haiti': 'North America',
  'Dominican Republic': 'North America', 'Trinidad and Tobago': 'North America',
  'Bahamas': 'North America', 'Barbados': 'North America', 'Belize': 'North America',
  'Costa Rica': 'North America', 'El Salvador': 'North America', 'Guatemala': 'North America',
  'Honduras': 'North America', 'Nicaragua': 'North America', 'Panama': 'North America',
  'Antigua and Barbuda': 'North America', 'Dominica': 'North America', 'Grenada': 'North America',
  'Saint Kitts and Nevis': 'North America', 'Saint Lucia': 'North America',
  'Saint Vincent and the Grenadines': 'North America',
  'Cayman Islands': 'North America', 'Turks and Caicos Islands': 'North America',
  'Sint Maarten': 'North America', 'Aruba': 'North America', 'Puerto Rico': 'North America',

  // ── South America ──
  'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America',
  'Colombia': 'South America', 'Peru': 'South America', 'Venezuela': 'South America',
  'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
  'Uruguay': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
  'Buenos Aires Province': 'South America',

  // ── Europe ──
  'United Kingdom': 'Europe', 'France': 'Europe', 'Germany': 'Europe', 'Italy': 'Europe',
  'Spain': 'Europe', 'Netherlands': 'Europe', 'Belgium': 'Europe', 'Austria': 'Europe',
  'Switzerland': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe', 'Denmark': 'Europe',
  'Finland': 'Europe', 'Poland': 'Europe', 'Czech Republic': 'Europe', 'Czechia': 'Europe',
  'Hungary': 'Europe', 'Romania': 'Europe', 'Greece': 'Europe', 'Portugal': 'Europe',
  'Ireland': 'Europe', 'Russia': 'Europe', 'Ukraine': 'Europe', 'Turkey': 'Europe',
  'Croatia': 'Europe', 'Serbia': 'Europe', 'Bulgaria': 'Europe', 'Slovakia': 'Europe',
  'Slovenia': 'Europe', 'Lithuania': 'Europe', 'Latvia': 'Europe', 'Estonia': 'Europe',
  'Luxembourg': 'Europe', 'Malta': 'Europe', 'Cyprus': 'Europe', 'Iceland': 'Europe',
  'Montenegro': 'Europe', 'North Macedonia': 'Europe', 'Albania': 'Europe',
  'Bosnia and Herzegovina': 'Europe', 'Moldova': 'Europe', 'Georgia': 'Europe',
  'Armenia': 'Europe', 'Belarus': 'Europe', 'Andorra': 'Europe', 'Monaco': 'Europe',
  'Liechtenstein': 'Europe', 'San Marino': 'Europe', 'Vatican City': 'Europe',
  'Kosovo': 'Europe',
  // German states appearing as country
  'Nordrhein-Westfalen': 'Europe', 'Thuringen': 'Europe', 'Noord-Holland': 'Europe',
  // French regions
  'Provence-Alpes-Cote d\'Azur': 'Europe',
  // Georgian cities appearing as country
  'Tbilisi': 'Europe',
  // Serbian cities
  'Belgrade': 'Europe',

  // ── Asia ──
  'China': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia', 'North Korea': 'Asia',
  'India': 'Asia', 'Indonesia': 'Asia', 'Thailand': 'Asia', 'Vietnam': 'Asia',
  'Philippines': 'Asia', 'Malaysia': 'Asia', 'Singapore': 'Asia', 'Taiwan': 'Asia',
  'Israel': 'Asia', 'UAE': 'Asia', 'United Arab Emirates': 'Asia', 'Saudi Arabia': 'Asia',
  'Qatar': 'Asia', 'Iran': 'Asia', 'Iraq': 'Asia', 'Pakistan': 'Asia',
  'Bangladesh': 'Asia', 'Sri Lanka': 'Asia', 'Nepal': 'Asia', 'Cambodia': 'Asia',
  'Myanmar': 'Asia', 'Mongolia': 'Asia', 'Kazakhstan': 'Asia', 'Uzbekistan': 'Asia',
  'Azerbaijan': 'Asia', 'Tajikistan': 'Asia', 'Turkmenistan': 'Asia', 'Kyrgyzstan': 'Asia',
  'Bahrain': 'Asia', 'Oman': 'Asia', 'Kuwait': 'Asia', 'Jordan': 'Asia', 'Lebanon': 'Asia',
  'Syria': 'Asia', 'Yemen': 'Asia', 'Afghanistan': 'Asia', 'Bhutan': 'Asia',
  'Brunei': 'Asia', 'Laos': 'Asia', 'Timor-Leste': 'Asia', 'Palestine': 'Asia',
  // Japanese cities appearing as country
  'Tokyo': 'Asia', 'Osaka': 'Asia',
  // Israeli districts
  'Center District': 'Asia',

  // ── Oceania ──
  'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania',
  'Papua New Guinea': 'Oceania', 'Samoa': 'Oceania', 'Tonga': 'Oceania',
  'Vanuatu': 'Oceania', 'Solomon Islands': 'Oceania', 'Nauru': 'Oceania',
  'Tuvalu': 'Oceania', 'Palau': 'Oceania', 'Niue': 'Oceania', 'Cook Islands': 'Oceania',

  // ── Africa ──
  'Egypt': 'Africa', 'South Africa': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa',
  'Morocco': 'Africa', 'Tunisia': 'Africa', 'Ghana': 'Africa', 'Ethiopia': 'Africa',
  'Tanzania': 'Africa', 'Senegal': 'Africa', 'Algeria': 'Africa', 'Angola': 'Africa',
  'Benin': 'Africa', 'Botswana': 'Africa', 'Burkina Faso': 'Africa', 'Burundi': 'Africa',
  'Cameroon': 'Africa', 'Cape Verde': 'Africa', 'Central African Republic': 'Africa',
  'Chad': 'Africa', 'Comoros': 'Africa', 'Republic of the Congo': 'Africa',
  'Democratic Republic of the Congo': 'Africa', 'Ivory Coast': 'Africa',
  'Djibouti': 'Africa', 'Equatorial Guinea': 'Africa', 'Eritrea': 'Africa',
  'Eswatini': 'Africa', 'Gabon': 'Africa', 'Gambia': 'Africa', 'Guinea': 'Africa',
  'Guinea-Bissau': 'Africa', 'Lesotho': 'Africa', 'Liberia': 'Africa', 'Libya': 'Africa',
  'Madagascar': 'Africa', 'Malawi': 'Africa', 'Mali': 'Africa', 'Mauritania': 'Africa',
  'Mauritius': 'Africa', 'Mozambique': 'Africa', 'Namibia': 'Africa', 'Niger': 'Africa',
  'Rwanda': 'Africa', 'Sao Tome and Principe': 'Africa', 'Seychelles': 'Africa',
  'Sierra Leone': 'Africa', 'Somalia': 'Africa', 'South Sudan': 'Africa',
  'Sudan': 'Africa', 'Togo': 'Africa', 'Uganda': 'Africa', 'Zambia': 'Africa',
  'Zimbabwe': 'Africa',
  'South Georgia': 'Africa', // South Georgia and the South Sandwich Islands

  // ── US States appearing as country ──
  'California': 'North America', 'New York': 'North America', 'Ohio': 'North America',
  'Pennsylvania': 'North America', 'North Carolina': 'North America', 'Texas': 'North America',
  'Vermont': 'North America', 'West Virginia': 'North America', 'Washington': 'North America',
};

/**
 * Returns the continent for a given country string.
 * Falls back to 'Unmapped' only for truly unknown values.
 */
export function getContinent(country: string): string {
  if (!country || country === 'Unknown') return 'Unmapped';
  return COUNTRY_TO_CONTINENT[country] || 'Unmapped';
}
