import { EligibilityCategory, EligibilityCatalogItem } from '@/types/eligibility';
export { COMMON_SCHOOLS, COMMON_LIBRARIES, COMMON_EMPLOYERS } from '@/lib/eligibilityData';

export const CITYPASS_CITIES = [
  'Atlanta',
  'Boston',
  'Chicago',
  'Dallas',
  'Denver',
  'Houston',
  'Los Angeles',
  'New York',
  'Orlando',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'San Francisco',
  'Seattle',
  'Southern California',
  'Tampa Bay',
  'Toronto',
];

export const ELIGIBILITY_CATALOG: EligibilityCategory[] = [
  {
    id: 'financial',
    label: 'Financial Assistance',
    items: [
      {
        type: 'snap_ebt',
        label: 'SNAP / EBT Card Holder | Museums for All',
        icon: '🏛️',
        description: 'Free or reduced admission at 900+ museums nationwide',
        infoUrl: 'https://museums4all.org/',
      },
    ],
  },
  {
    id: 'bank',
    label: 'Bank & Cardholder Programs',
    items: [
      {
        type: 'bofa_museums_on_us',
        label: 'Bank of America Card Holder | Museum on US',
        icon: '💳',
        description: 'Free admission on the first full weekend of each month',
        infoUrl: 'https://about.bankofamerica.com/en/making-an-impact/museums-on-us-partners',
      },
    ],
  },
  {
    id: 'citypass',
    label: 'City Tourism Passes',
    items: [
      {
        type: 'city_pass',
        label: 'CityPass',
        icon: '🏙️',
        description: 'Bundled admission to top attractions in major cities',
        hasDetails: 'cities',
        infoUrl: 'https://www.citypass.com/',
      },
    ],
  },
  {
    id: 'student',
    label: 'Student',
    items: [
      {
        type: 'student',
        label: 'Student ID',
        icon: '🎓',
        description: 'Student discount with valid school ID',
        hasDetails: 'schools',
      },
    ],
  },
  {
    id: 'military',
    label: 'Military & Service',
    items: [
      {
        type: 'military',
        label: 'Active Duty / Veteran',
        icon: '🎖️',
        description: 'Military discount for active duty and veterans',
      },
      {
        type: 'blue_star',
        label: 'Blue Star Museums',
        icon: '⭐',
        description: 'Free admission for active duty military families',
        infoUrl: 'https://www.arts.gov/bluestarmuseums',
      },
    ],
  },
  {
    id: 'library',
    label: 'Library & City Programs',
    items: [
      {
        type: 'library_pass',
        label: 'Local Library Card Holder',
        icon: '📚',
        description: 'Free or discounted passes through your library',
        hasDetails: 'libraries',
      },
    ],
  },
  {
    id: 'membership',
    label: 'Memberships & Reciprocity',
    items: [
      {
        type: 'icom',
        label: 'ICOM Member',
        icon: '🌐',
        description: 'International Council of Museums membership',
        infoUrl: 'https://icom.museum/en/get-involved/become-a-member/',
      },
      {
        type: 'reciprocal_museum',
        label: 'Reciprocal Museum Membership',
        icon: '🔄',
        description: 'Reciprocal admission at partner museums',
      },
      {
        type: 'science_reciprocity',
        label: 'Science Center Reciprocity',
        icon: '🔬',
        description: 'ASTC-style reciprocal science center admission',
      },
    ],
  },
  {
    id: 'employer',
    label: 'Employer Benefits',
    items: [
      {
        type: 'employer',
        label: 'Company Employee',
        icon: '🏢',
        description: 'Employee benefits or corporate museum partnerships',
        hasDetails: 'companies',
      },
    ],
  },
  {
    id: 'age',
    label: 'Age-Based Discounts',
    items: [
      {
        type: 'age_based',
        label: 'Age Eligibility (Child/Youth/Senior)',
        icon: '🎂',
        description: 'Age-based discounts calculated from your date of birth',
        hasDetails: 'date_of_birth',
      },
    ],
  },
  {
    id: 'other',
    label: 'Other Common Audiences',
    items: [
      {
        type: 'teacher',
        label: 'Teacher / Educator',
        icon: '📝',
        description: 'Educator discount with valid ID',
      },
      {
        type: 'first_responder',
        label: 'First Responder',
        icon: '🚒',
        description: 'Discount for first responders',
      },
      {
        type: 'local_resident',
        label: 'Local Resident',
        icon: '🏠',
        description: 'Discounts for local residents',
        hasDetails: 'locations',
      },
    ],
  },
];


export const ALL_CATALOG_ITEMS: EligibilityCatalogItem[] = ELIGIBILITY_CATALOG.flatMap(c => c.items);
