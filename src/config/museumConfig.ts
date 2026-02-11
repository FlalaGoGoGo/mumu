// Hardcoded museum configuration for MVP
// This config is used for the Museum Detail page

export interface MuseumSocialLinks {
  websiteUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  xiaohongshuUrl?: string;
}

export interface MuseumConfig {
  museum_id: string;
  name: string;
  address: string;
  country: string;
  logoUrl?: string;
  alternateEntrance?: string;
  hours: { day: string; hours: string }[];
  admission: { category: string; price: string }[];
  freeAdmissionNote: string;
  memberNote: string;
  ticketsUrl: string;
  googleMapsUrl: string;
  socialLinks: MuseumSocialLinks;
}

export const AIC_CONFIG: MuseumConfig = {
  museum_id: 'the-art-institute-of-chicago-us',
  name: 'The Art Institute of Chicago',
  address: '111 S Michigan Ave, Chicago, IL 60603',
  country: 'United States',
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Art_Institute_of_Chicago_logo.svg/1200px-Art_Institute_of_Chicago_logo.svg.png',
  alternateEntrance: '159 E Monroe St, Chicago, IL 60603 (Modern Wing Entrance)',
  hours: [
    { day: 'Mon', hours: '11–5' },
    { day: 'Tue', hours: 'Closed' },
    { day: 'Wed', hours: '11–5' },
    { day: 'Thu', hours: '11–8' },
    { day: 'Fri', hours: '11–5' },
    { day: 'Sat', hours: '11–5' },
    { day: 'Sun', hours: '11–5' },
  ],
  admission: [
    { category: 'Adult', price: '$40' },
    { category: 'Seniors (65+)', price: '$34' },
    { category: 'Students', price: '$34' },
    { category: 'Teens (14–17)', price: '$34' },
    { category: 'Children', price: 'Free' },
  ],
  freeAdmissionNote: 'Illinois residents: free admission every weekday we are open (11 a.m. to closing).',
  memberNote: 'The first hour of every day, 10–11 a.m., is reserved for member-only viewing.',
  ticketsUrl: 'https://sales.artic.edu/Admissions',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Art+Institute+of+Chicago',
  socialLinks: {
    websiteUrl: 'https://www.artic.edu',
    instagramUrl: 'https://www.instagram.com/artinstitutechi/',
    xUrl: 'https://x.com/artaboretumchi',
  },
};

// Map of museum_id to config for quick lookup
export const MUSEUM_CONFIGS: Record<string, MuseumConfig> = {
  [AIC_CONFIG.museum_id]: AIC_CONFIG,
};

export function getMuseumConfig(museumId: string): MuseumConfig | null {
  return MUSEUM_CONFIGS[museumId] || null;
}
