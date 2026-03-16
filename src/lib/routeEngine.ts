/**
 * Client-side route generation engine for museum visits.
 * Generates gallery-based visit flows with anchor works, nearby supporting works,
 * and optional bonus stops. Routes scale realistically by time budget.
 */
import type { VisitIntake, RoutePlan, RouteStep, ArtworkRef, Citation } from '@/types/museumDetail';

// ─── Citations ───
const CIT_FLOOR: Citation = {
  id: 'floor-plan', label: 'AIC Museum Floor Plan',
  url: 'https://www.artic.edu/visit/explore-on-your-own/museum-floor-plan',
  sourceKind: 'official_live', accessedAt: '2026-03-15',
};
const CIT_POLICIES: Citation = {
  id: 'visitor-policies', label: 'AIC Visitor Policies',
  url: 'https://www.artic.edu/visit/visitor-policies',
  sourceKind: 'official_live', accessedAt: '2026-03-15',
};
const CIT_DINING: Citation = {
  id: 'dining-shopping', label: 'AIC Dining and Shopping',
  url: 'https://www.artic.edu/visit/dining-and-shopping',
  sourceKind: 'official_live', accessedAt: '2026-03-15',
};
const CIT_ACCESS: Citation = {
  id: 'accessibility', label: 'AIC Accessibility',
  url: 'https://www.artic.edu/visit/accessibility',
  sourceKind: 'official_live', accessedAt: '2026-03-15',
};

// ─── Rich AIC Gallery Catalog ───
// Each gallery zone has an anchor work, nearby works, and optional bonus works.
// This is the prototype content layer; production would pull from AIC API.

interface GalleryZone {
  galleryNumber: string;
  galleryName: string;
  floor: string;
  zone: string;
  /** Priority: 1 = must-see, 2 = recommended, 3 = optional/bonus */
  priority: 1 | 2 | 3;
  /** Base time at steady pace (minutes) */
  baseDuration: number;
  clusterRationale: string;
  anchor: ArtworkRef;
  nearby: ArtworkRef[];
  bonus: ArtworkRef[];
  familyFriendly: boolean;
  accessible: boolean;
  /** Transition hint from previous gallery */
  transitionFrom?: Record<string, string>;
}

const GALLERY_CATALOG: GalleryZone[] = [
  // ── Impressionism Wing (Floor 2) ──
  {
    galleryNumber: '240',
    galleryName: 'Pointillism & Post-Impressionism',
    floor: '2',
    zone: 'Impressionism Wing',
    priority: 1,
    baseDuration: 15,
    clusterRationale: 'This gallery holds the museum\'s most iconic work and demonstrates the revolutionary pointillist technique that changed modern painting.',
    anchor: {
      id: '27992', title: 'A Sunday on La Grande Jatte — 1884', artistTitle: 'Georges Seurat',
      year: '1884–86', imageUrl: 'https://www.artic.edu/iiif/2/2d484387-2509-5e8e-2c43-22f9981972eb/full/843,/0/default.jpg',
      museumPageUrl: 'https://www.artic.edu/artworks/27992', apiUrl: 'https://api.artic.edu/api/v1/artworks/27992',
      isOnView: true, galleryNumber: '240', floor: '2', mustSee: true,
      shortDescription: 'The iconic pointillist masterpiece — take time to step close and see the individual dots, then step back to let the image resolve.',
    },
    nearby: [
      {
        id: '16487', title: 'The Child\'s Bath', artistTitle: 'Mary Cassatt',
        year: '1893', imageUrl: 'https://www.artic.edu/iiif/2/b1be1a35-23e4-b4a4-abb2-0c082d20bfed/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/16487', isOnView: true, galleryNumber: '240', floor: '2', mustSee: false,
        shortDescription: 'Cassatt\'s intimate domestic scene — notice the aerial perspective and Japanese print influence.',
      },
      {
        id: '46230', title: 'The Millinery Shop', artistTitle: 'Edgar Degas',
        year: '1879–86', imageUrl: 'https://www.artic.edu/iiif/2/38d8e95e-fbe3-af73-7ce7-c5a688c5600c/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/46230', isOnView: true, galleryNumber: '240', floor: '2', mustSee: false,
        shortDescription: 'Degas captures a working woman — the asymmetric composition pulls you into her world.',
      },
    ],
    bonus: [
      {
        id: '14591', title: 'Paris Street; Rainy Day', artistTitle: 'Gustave Caillebotte',
        year: '1877', imageUrl: 'https://www.artic.edu/iiif/2/f4d76404-df25-788a-9561-0c7189020039/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/14591', isOnView: true, galleryNumber: '240', floor: '2', mustSee: false,
        shortDescription: 'The sheer scale of this painting rewards spending a minute looking at perspective lines.',
      },
    ],
    familyFriendly: true, accessible: true,
    transitionFrom: { 'entrance': 'Head up to Floor 2 and follow signs toward the Impressionism galleries.' },
  },
  {
    galleryNumber: '241',
    galleryName: 'Van Gogh & Post-Impressionism',
    floor: '2',
    zone: 'Impressionism Wing',
    priority: 1,
    baseDuration: 15,
    clusterRationale: 'Three Van Gogh works in one room let you trace his evolving style — from Arles color experiments to the psychological intensity of self-portraiture.',
    anchor: {
      id: '28560', title: 'The Bedroom', artistTitle: 'Vincent van Gogh',
      year: '1889', imageUrl: 'https://www.artic.edu/iiif/2/25c31d8d-21a4-9ea1-1d73-6a2eca4dda7e/full/843,/0/default.jpg',
      museumPageUrl: 'https://www.artic.edu/artworks/28560', isOnView: true, galleryNumber: '241', floor: '2', mustSee: true,
      shortDescription: 'Van Gogh\'s iconic bedroom — he painted three versions, and this is the first.',
    },
    nearby: [
      {
        id: '80607', title: 'Self-Portrait', artistTitle: 'Vincent van Gogh',
        year: '1887', imageUrl: 'https://www.artic.edu/iiif/2/47c5bcb8-62ef-e5d7-55e7-f5121f409a30/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/80607', isOnView: true, galleryNumber: '241', floor: '2', mustSee: true,
        shortDescription: 'Compare the brushwork here to The Bedroom — both reveal Van Gogh\'s emotional state.',
      },
      {
        id: '14586', title: 'The Poet\'s Garden', artistTitle: 'Vincent van Gogh',
        year: '1888', imageUrl: 'https://www.artic.edu/iiif/2/d4bc1723-7cbc-d36d-a9cb-f84553f2a6f6/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/14586', isOnView: true, galleryNumber: '241', floor: '2', mustSee: false,
        shortDescription: 'Painted in Arles for Gauguin\'s visit — a rare glimpse of Van Gogh trying to impress a peer.',
      },
    ],
    bonus: [
      {
        id: '64818', title: 'Madame Roulin Rocking the Cradle', artistTitle: 'Vincent van Gogh',
        year: '1889', imageUrl: 'https://www.artic.edu/iiif/2/dcf2afc6-7e20-edcd-c9c1-61c0c91d tried/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/64818', isOnView: true, galleryNumber: '241', floor: '2', mustSee: false,
        shortDescription: 'Van Gogh considered this portrait his most consoling painting.',
      },
    ],
    familyFriendly: true, accessible: true,
    transitionFrom: { '240': 'Walk through the next doorway — Gallery 241 is directly adjacent.' },
  },
  {
    galleryNumber: '243',
    galleryName: 'Monet\'s Water Lilies & Late Work',
    floor: '2',
    zone: 'Impressionism Wing',
    priority: 2,
    baseDuration: 12,
    clusterRationale: 'Monet\'s late water lily paintings are immersive, large-scale works that benefit from standing back and letting your eyes adjust to the color.',
    anchor: {
      id: '16568', title: 'Water Lilies', artistTitle: 'Claude Monet',
      year: '1906', imageUrl: 'https://www.artic.edu/iiif/2/3c27b499-af56-f0d5-93b5-a7f2f1ad5813/full/843,/0/default.jpg',
      museumPageUrl: 'https://www.artic.edu/artworks/16568', isOnView: true, galleryNumber: '243', floor: '2', mustSee: false,
      shortDescription: 'Step back for the full effect — Monet was losing his sight when he painted these.',
    },
    nearby: [
      {
        id: '16571', title: 'Water Lily Pond', artistTitle: 'Claude Monet',
        year: '1900', imageUrl: 'https://www.artic.edu/iiif/2/98ced9b0-9ebe-7ec1-3166-00a6fa853cf6/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/16571', isOnView: true, galleryNumber: '243', floor: '2', mustSee: false,
        shortDescription: 'An earlier view of the same pond — compare how the bridge disappears in later paintings.',
      },
      {
        id: '44892', title: 'Stacks of Wheat (End of Summer)', artistTitle: 'Claude Monet',
        year: '1890–91', imageUrl: 'https://www.artic.edu/iiif/2/4e7d4a98-4024-3168-d649-c04e0940fe15/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/44892', isOnView: true, galleryNumber: '243', floor: '2', mustSee: false,
        shortDescription: 'Part of Monet\'s famous series — he painted the same haystacks in different light conditions.',
      },
    ],
    bonus: [],
    familyFriendly: true, accessible: true,
    transitionFrom: { '241': 'Continue through the corridor — Monet\'s gallery is two rooms ahead.' },
  },
  {
    galleryNumber: '201',
    galleryName: 'Early Impressionism',
    floor: '2',
    zone: 'Impressionism Wing',
    priority: 2,
    baseDuration: 12,
    clusterRationale: 'This gallery shows Impressionism\'s roots — Monet, Renoir, and Morisot painting outdoors and capturing fleeting light for the first time.',
    anchor: {
      id: '81539', title: 'On the Bank of the Seine, Bennecourt', artistTitle: 'Claude Monet',
      year: '1868', imageUrl: 'https://www.artic.edu/iiif/2/66f95ea3-a11a-1cf4-6599-d0a49bb25744/full/843,/0/default.jpg',
      museumPageUrl: 'https://www.artic.edu/artworks/81539', isOnView: true, galleryNumber: '201', floor: '2', mustSee: false,
      shortDescription: 'An early Monet plein-air painting — see how different his technique is from the Water Lilies.',
    },
    nearby: [
      {
        id: '14647', title: 'Young Woman Sewing', artistTitle: 'Pierre-Auguste Renoir',
        year: '1879', imageUrl: 'https://www.artic.edu/iiif/2/147e3ce7-1c08-fa84-57f7-f59d4ec90d3c/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/14647', isOnView: true, galleryNumber: '201', floor: '2', mustSee: false,
        shortDescription: 'Renoir\'s soft brushwork shows a gentler side of Impressionism.',
      },
      {
        id: '95998', title: 'Woman Reading', artistTitle: 'Édouard Manet',
        year: '1878–79', imageUrl: 'https://www.artic.edu/iiif/2/de85f467-cfba-1e5e-67eb-9a62e70f3bea/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/95998', isOnView: true, galleryNumber: '201', floor: '2', mustSee: false,
        shortDescription: 'Manet bridged Realism and Impressionism — his brushwork here is looser than his earlier work.',
      },
    ],
    bonus: [],
    familyFriendly: true, accessible: true,
    transitionFrom: { '243': 'Continue through the Impressionism wing — Gallery 201 is near the end.' },
  },
  // ── American Art (Floor 2) ──
  {
    galleryNumber: '262',
    galleryName: 'American Icons',
    floor: '2',
    zone: 'American Art',
    priority: 1,
    baseDuration: 15,
    clusterRationale: 'This gallery holds two of the most recognizable American paintings ever made. Together they define a vision of American life and loneliness.',
    anchor: {
      id: '111628', title: 'Nighthawks', artistTitle: 'Edward Hopper',
      year: '1942', imageUrl: 'https://www.artic.edu/iiif/2/831a05de-d3f6-f4fa-a460-23008dd58dda/full/843,/0/default.jpg',
      museumPageUrl: 'https://www.artic.edu/artworks/111628', isOnView: true, galleryNumber: '262', floor: '2', mustSee: true,
      shortDescription: 'Perhaps the most famous American painting — notice there is no door to the diner.',
    },
    nearby: [
      {
        id: '6565', title: 'American Gothic', artistTitle: 'Grant Wood',
        year: '1930', imageUrl: 'https://www.artic.edu/iiif/2/b272df73-a965-ac37-4172-be4e99483637/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/6565', isOnView: true, galleryNumber: '262', floor: '2', mustSee: true,
        shortDescription: 'The farmer and his daughter — or is it his wife? Wood was deliberately ambiguous.',
      },
      {
        id: '76571', title: 'The Herring Net', artistTitle: 'Winslow Homer',
        year: '1885', imageUrl: 'https://www.artic.edu/iiif/2/51713dcf-bfe2-4cf0-f752-a26f9e42e0d2/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/76571', isOnView: true, galleryNumber: '262', floor: '2', mustSee: false,
        shortDescription: 'Homer painted this after spending time with fishing communities in England.',
      },
    ],
    bonus: [
      {
        id: '100858', title: 'Sky Above Clouds IV', artistTitle: 'Georgia O\'Keeffe',
        year: '1965', imageUrl: 'https://www.artic.edu/iiif/2/66530ca4-3684-d13d-3541-e8fe7f0a36a0/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/100858', isOnView: true, galleryNumber: '249', floor: '2', mustSee: false,
        shortDescription: 'O\'Keeffe\'s largest painting — inspired by views from airplane windows. Nearby in Gallery 249.',
      },
    ],
    familyFriendly: true, accessible: true,
    transitionFrom: {
      '240': 'Walk through the main corridor toward the American Art wing — about 4 minutes.',
      '241': 'Head east through the connecting galleries — Nighthawks is a short walk away.',
    },
  },
  // ── Medieval & Arms (Floor 1) ──
  {
    galleryNumber: '236',
    galleryName: 'Medieval & Renaissance Art',
    floor: '1',
    zone: 'European Decorative Arts',
    priority: 3,
    baseDuration: 10,
    clusterRationale: 'A dramatic change of pace — armored knights, stained glass, and altarpieces transport you to a different era.',
    anchor: {
      id: '5580', title: 'Fragment of a Floor Mosaic with a Personification of a Season', artistTitle: 'Roman',
      year: 'c. 2nd century', imageUrl: 'https://www.artic.edu/iiif/2/2e5d9a03-a7f1-1c7f-a9ae-d8d8d8d8d8d8/full/843,/0/default.jpg',
      museumPageUrl: 'https://www.artic.edu/artworks/5580', isOnView: true, galleryNumber: '236', floor: '1', mustSee: false,
      shortDescription: 'A remarkably preserved Roman mosaic — kids love finding the tiny animal details.',
    },
    nearby: [
      {
        id: '9503', title: 'Armor for Man and Horse', artistTitle: 'German',
        year: 'c. 1480', imageUrl: 'https://www.artic.edu/iiif/2/a9a27d76-da6e-5f55-0d06-37af0b76b2c2/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/9503', isOnView: true, galleryNumber: '236', floor: '1', mustSee: false,
        shortDescription: 'Full plate armor for both rider and horse — a highlight for children and history lovers.',
      },
    ],
    bonus: [],
    familyFriendly: true, accessible: true,
    transitionFrom: { 'entrance': 'From the Michigan Avenue entrance, head left into the European galleries on Floor 1.' },
  },
  // ── Modern Wing (Floor 3) ──
  {
    galleryNumber: '391',
    galleryName: 'Modern & Contemporary',
    floor: '3',
    zone: 'Modern Wing',
    priority: 2,
    baseDuration: 12,
    clusterRationale: 'The Modern Wing offers a completely different atmosphere with natural light and open space — a refreshing shift from the historic galleries.',
    anchor: {
      id: '229354', title: 'The Old Guitarist', artistTitle: 'Pablo Picasso',
      year: '1903–04', imageUrl: 'https://www.artic.edu/iiif/2/d0ed1e54-e632-6fdc-a3f7-1d1cf8607c79/full/843,/0/default.jpg',
      museumPageUrl: 'https://www.artic.edu/artworks/229354', isOnView: true, galleryNumber: '391', floor: '3', mustSee: true,
      shortDescription: 'Picasso\'s Blue Period masterpiece — look closely and you can see a hidden painting beneath the surface.',
    },
    nearby: [
      {
        id: '184362', title: 'The Weaver (after Millet)', artistTitle: 'Pablo Picasso',
        year: '1936', imageUrl: 'https://www.artic.edu/iiif/2/50a8fbc1-3048-d316-9aae-ae8b45e77cfe/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/184362', isOnView: true, galleryNumber: '391', floor: '3', mustSee: false,
        shortDescription: 'See how Picasso evolved from the Blue Period to cubism — a 30-year artistic journey in one room.',
      },
      {
        id: '109275', title: 'Inventions of the Monsters', artistTitle: 'Salvador Dalí',
        year: '1937', imageUrl: 'https://www.artic.edu/iiif/2/6f9c2e6f-bfb7-bc35-dbc8-10c64bac1fa3/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/109275', isOnView: true, galleryNumber: '391', floor: '3', mustSee: false,
        shortDescription: 'Dalí painted this as a warning about the Spanish Civil War — every detail is symbolic.',
      },
    ],
    bonus: [
      {
        id: '59426', title: 'Two Sisters (On the Terrace)', artistTitle: 'Pierre-Auguste Renoir',
        year: '1881', imageUrl: 'https://www.artic.edu/iiif/2/bc63e9b5-e0cd-d778-9cff-3bb891f9aedb/full/843,/0/default.jpg',
        museumPageUrl: 'https://www.artic.edu/artworks/59426', isOnView: true, galleryNumber: '201', floor: '2', mustSee: false,
        shortDescription: 'If you have time, double back to Gallery 201 for this famous Renoir.',
      },
    ],
    familyFriendly: true, accessible: true,
    transitionFrom: {
      '262': 'Take the elevator or stairs to Floor 3 in the Modern Wing — the architecture itself is worth noticing.',
      '201': 'Cross the Nichols Bridgeway into the Modern Wing and head up to Floor 3.',
    },
  },
  // ── Photography & Miniature Rooms (Floor 1) ──
  {
    galleryNumber: '11',
    galleryName: 'Thorne Miniature Rooms',
    floor: '1',
    zone: 'Lower Level',
    priority: 3,
    baseDuration: 10,
    clusterRationale: 'The Thorne Miniature Rooms are a hidden gem — 68 tiny rooms built at 1:12 scale, each recreating a historical interior. A favorite for families.',
    anchor: {
      id: 'thorne-rooms', title: 'Thorne Miniature Rooms Collection', artistTitle: 'Narcissa Niblack Thorne',
      year: '1930s–40s', imageUrl: 'https://www.artic.edu/iiif/2/54c75c74-13dc-e7f3-db5e-c8f6e31e2075/full/843,/0/default.jpg',
      museumPageUrl: 'https://www.artic.edu/artworks', isOnView: true, galleryNumber: '11', floor: '1', mustSee: false,
      shortDescription: '68 miniature rooms at 1:12 scale — kids are mesmerized, and adults appreciate the historical detail.',
    },
    nearby: [],
    bonus: [],
    familyFriendly: true, accessible: true,
    transitionFrom: { 'entrance': 'Head downstairs from the Michigan Avenue entrance — follow signs to the Lower Level.' },
  },
];

// ─── Route Generation ───

export function generateRoute(
  intake: Partial<VisitIntake>,
  _allArtworks: ArtworkRef[],
): RoutePlan {
  const timeBudget = intake.timeBudgetMinutes || 120;
  const withChildren = intake.withChildren || false;
  const needsAccessibility = intake.needsAccessibility || false;
  const largeBags = intake.largeBags || false;
  const foodPlan = intake.foodPlan || 'none';
  const pace = intake.pace || 'steady';
  const entranceId = intake.entryEntranceId || 'michigan-avenue';

  // Pace multipliers
  const paceM = pace === 'slow' ? 1.4 : pace === 'fast' ? 0.7 : 1.0;
  const childM = withChildren ? 1.3 : 1.0;
  const accessM = needsAccessibility ? 1.2 : 1.0;
  const totalMult = paceM * childM * accessM;

  // Fixed overhead
  const entranceTime = largeBags ? 15 : 8;
  const exitTime = 5;
  const foodTime = foodPlan === 'none' ? 0 : foodPlan === 'coffee_break' ? 15 : foodPlan === 'light_meal' ? 25 : foodPlan === 'full_meal' ? 45 : 15;
  const availableGalleryTime = timeBudget - entranceTime - exitTime - foodTime;

  // Select galleries based on priority and time
  const sortedGalleries = [...GALLERY_CATALOG].sort((a, b) => {
    // Children? Boost family-friendly and floor-1 zones
    if (withChildren) {
      if (a.galleryNumber === '11' && b.galleryNumber !== '11') return -1;
      if (b.galleryNumber === '11' && a.galleryNumber !== '11') return 1;
      if (a.galleryNumber === '236' && a.priority === b.priority) return -1;
    }
    return a.priority - b.priority;
  });

  const selectedGalleries: Array<GalleryZone & { adjustedDuration: number; walkTime: number; isOptional: boolean }> = [];
  let usedTime = 0;

  for (const gallery of sortedGalleries) {
    const adjustedDuration = Math.round(gallery.baseDuration * totalMult);
    // Walk time: first gallery gets more, floor changes cost extra
    const prevFloor = selectedGalleries.length > 0 ? selectedGalleries[selectedGalleries.length - 1].floor : '1';
    const floorChange = prevFloor !== gallery.floor;
    const walkTime = selectedGalleries.length === 0
      ? (entranceId === 'modern-wing' && gallery.zone === 'Modern Wing' ? 3 : 5)
      : (floorChange ? (needsAccessibility ? 8 : 6) : (needsAccessibility ? 5 : 3));

    const totalForStop = adjustedDuration + walkTime;
    const isOptional = gallery.priority >= 3 || (gallery.priority === 2 && usedTime + totalForStop > availableGalleryTime * 0.7);

    if (usedTime + totalForStop > availableGalleryTime) {
      // Still try to include at least 2 must-see galleries
      const mustSeeCount = selectedGalleries.filter(g => g.priority === 1).length;
      if (mustSeeCount < 2 && gallery.priority === 1) {
        selectedGalleries.push({ ...gallery, adjustedDuration, walkTime, isOptional: false });
        usedTime += totalForStop;
        continue;
      }
      // For longer budgets, keep adding optional galleries
      if (timeBudget >= 180 && gallery.priority <= 2 && usedTime + totalForStop <= availableGalleryTime + 10) {
        selectedGalleries.push({ ...gallery, adjustedDuration, walkTime, isOptional: true });
        usedTime += totalForStop;
        continue;
      }
      break;
    }

    selectedGalleries.push({ ...gallery, adjustedDuration, walkTime, isOptional });
    usedTime += totalForStop;
  }

  // Build route steps
  const steps: RouteStep[] = [];
  let order = 1;

  // ── Entrance Step ──
  const entranceName = entranceId === 'modern-wing' ? 'Modern Wing Entrance' : 'Michigan Avenue Entrance';
  const entranceFacilities: RouteStep['nearbyFacilities'] = [
    { key: 'restroom', label: 'Entry-level restrooms' },
  ];
  if (largeBags) entranceFacilities.unshift({ key: 'checkroom', label: 'Free bag check at entrance' });
  if (withChildren) entranceFacilities.push({ key: 'family_restroom', label: 'Family restrooms nearby' });
  if (needsAccessibility) entranceFacilities.push({ key: 'wheelchair', label: 'Free wheelchairs available' });

  steps.push({
    stepId: `step-${order}`,
    order: order++,
    type: 'entrance',
    title: `Enter via ${entranceName.replace(' Entrance', '')}`,
    subtitle: largeBags
      ? 'Check bags at the free checkroom, then head to Floor 2'
      : withChildren
      ? 'Pick up a family guide and head upstairs'
      : 'Pick up a map and begin your visit',
    location: { label: entranceName, floor: '1', galleryId: null, galleryNumber: null, zone: 'Main entry' },
    durationMinutes: entranceTime,
    walkMinutesFromPrevious: 0,
    whyThisStop: largeBags
      ? 'Bags larger than 13×17×4 inches must be checked. The checkroom is free and located near the entrance.'
      : entranceId === 'modern-wing'
      ? 'The Modern Wing entrance gives direct access to contemporary galleries and the Ryan Learning Center.'
      : 'The Michigan Avenue entrance is the clearest arrival for first-time visitors.',
    transitionHint: null,
    isOptional: false,
    primaryObjects: [],
    nearbyFacilities: entranceFacilities,
    replanHints: ['If the entry line is long, this route still works — just trim the last optional stop.'],
    citations: [CIT_POLICIES, CIT_FLOOR],
  });

  // ── Gallery Steps ──
  for (let i = 0; i < selectedGalleries.length; i++) {
    const gallery = selectedGalleries[i];
    const prevKey = i === 0 ? 'entrance' : selectedGalleries[i - 1].galleryNumber;

    // Determine how many nearby works to show based on time budget
    const nearbyCount = timeBudget <= 60 ? 0 : timeBudget <= 120 ? Math.min(2, gallery.nearby.length) : gallery.nearby.length;
    const showBonus = timeBudget >= 180 && !gallery.isOptional;

    const transition = gallery.transitionFrom?.[prevKey] || gallery.transitionFrom?.['entrance'] || null;

    const facilities: RouteStep['nearbyFacilities'] = [];
    if (needsAccessibility) facilities.push({ key: 'elevator', label: 'Elevator access on this floor' });
    facilities.push({ key: 'restroom', label: 'Nearby restrooms' });
    if (withChildren && gallery.galleryNumber === '236') {
      facilities.push({ key: 'quiet_space', label: 'Bench seating in gallery' });
    }

    const artCitations: Citation[] = [{
      id: `gallery-${gallery.galleryNumber}`,
      label: `AIC Gallery ${gallery.galleryNumber}`,
      url: `https://www.artic.edu/visit/explore-on-your-own/museum-floor-plan`,
      sourceKind: 'official_live' as const,
      accessedAt: '2026-03-15',
    }];

    const replanHints: string[] = [];
    if (gallery.isOptional) {
      replanHints.push('This is an optional stop — skip it first if you need more time for must-see galleries.');
    } else if (i >= 2) {
      replanHints.push('If running behind, spend less time on nearby works but don\'t skip the anchor piece.');
    }
    if (timeBudget <= 90 && nearbyCount > 0) {
      replanHints.push('Short on time? Focus on the anchor work and glance at the rest as you walk through.');
    }

    steps.push({
      stepId: `step-${order}`,
      order: order++,
      type: 'gallery',
      title: `Gallery ${gallery.galleryNumber} — ${gallery.galleryName}`,
      subtitle: gallery.isOptional
        ? `Optional · ${gallery.zone}`
        : gallery.priority === 1
        ? `Must-see · ${gallery.zone}`
        : gallery.zone,
      location: {
        label: `Gallery ${gallery.galleryNumber}`,
        floor: gallery.floor,
        galleryId: null,
        galleryNumber: gallery.galleryNumber,
        zone: gallery.zone,
      },
      durationMinutes: gallery.adjustedDuration,
      walkMinutesFromPrevious: gallery.walkTime,
      whyThisStop: gallery.clusterRationale,
      transitionHint: transition,
      isOptional: gallery.isOptional,
      clusterRationale: gallery.clusterRationale,
      anchorWork: gallery.anchor,
      nearbyWorks: gallery.nearby.slice(0, nearbyCount),
      bonusWorks: showBonus ? gallery.bonus : [],
      primaryObjects: [gallery.anchor, ...gallery.nearby.slice(0, nearbyCount), ...(showBonus ? gallery.bonus : [])],
      nearbyFacilities: facilities,
      replanHints,
      citations: artCitations,
    });
  }

  // ── Food Step ──
  if (foodPlan !== 'none') {
    const foodLabels: Record<string, string> = {
      coffee_break: 'Coffee Break',
      light_meal: 'Light Meal',
      full_meal: 'Terzo Piano — Full Meal',
      flexible: 'Quick Refreshment',
    };
    steps.push({
      stepId: `step-${order}`,
      order: order++,
      type: 'meal',
      title: foodLabels[foodPlan] || 'Refreshment Stop',
      subtitle: foodPlan === 'full_meal' ? 'Reserve time for a sit-down meal' : 'Recharge before the next gallery',
      location: {
        label: foodPlan === 'full_meal' ? 'Terzo Piano, Modern Wing' : 'Café Moderno or Modern Bar',
        floor: foodPlan === 'full_meal' ? '3' : '2',
        galleryId: null, galleryNumber: null, zone: 'Modern Wing',
      },
      durationMinutes: foodTime,
      walkMinutesFromPrevious: 4,
      whyThisStop: `You wanted a ${foodPlan.replace(/_/g, ' ')} during your visit.`,
      transitionHint: 'Head toward the Modern Wing — dining options are on Floors 2 and 3.',
      isOptional: false,
      primaryObjects: [],
      nearbyFacilities: [
        { key: 'cafe', label: foodPlan === 'full_meal' ? 'Terzo Piano' : 'Café Moderno' },
        { key: 'restroom', label: 'Nearby restrooms' },
      ],
      replanHints: ['Drop this step first if you\'re running behind.'],
      citations: [CIT_DINING],
    });
  }

  // ── Exit Step ──
  steps.push({
    stepId: `step-${order}`,
    order: order++,
    type: 'exit',
    title: 'Exit the Museum',
    subtitle: largeBags ? 'Pick up your bag from the checkroom' : undefined,
    location: { label: 'Nearest exit', floor: '1', galleryId: null, galleryNumber: null, zone: 'Exit' },
    durationMinutes: exitTime,
    walkMinutesFromPrevious: 5,
    whyThisStop: 'End of route.',
    transitionHint: 'Head back toward the entrance level.',
    isOptional: false,
    primaryObjects: [],
    nearbyFacilities: largeBags ? [{ key: 'checkroom', label: 'Collect your bag' }] : [],
    replanHints: [],
    citations: [],
  });

  // Compute total
  const totalDuration = steps.reduce((sum, s) => sum + s.durationMinutes + s.walkMinutesFromPrevious, 0);
  const gallerySteps = selectedGalleries;
  const essentialCount = gallerySteps.filter(g => !g.isOptional).length;
  const optionalCount = gallerySteps.filter(g => g.isOptional).length;
  const totalArtworks = gallerySteps.reduce((sum, g) => sum + 1 + g.nearby.length + g.bonus.length, 0);

  // Build rationale
  const rationale: string[] = [];
  rationale.push(`Planned for ~${timeBudget} minutes at a ${pace} pace.`);
  if (withChildren) rationale.push('Adjusted for a family visit — added family-friendly stops and extra time at each gallery.');
  if (needsAccessibility) rationale.push('Prioritizes elevator-accessible paths with extra walking time between galleries.');
  if (largeBags) rationale.push('Includes a bag-check step at the entrance (bags larger than 13×17×4 in. must be checked).');
  if (foodPlan !== 'none') rationale.push(`Includes a ${foodPlan.replace(/_/g, ' ')} stop.`);
  rationale.push(`This route covers ${essentialCount} essential gallery zone${essentialCount !== 1 ? 's' : ''}${optionalCount > 0 ? ` + ${optionalCount} optional` : ''}, with ~${totalArtworks} works to see.`);
  if (timeBudget <= 60) rationale.push('With limited time, the route focuses only on anchor masterpieces — glance at nearby works as you pass through.');
  if (timeBudget >= 240) rationale.push('With a full visit, you can explore deeper into each gallery zone and add optional detours.');

  const routeCitations: Citation[] = [CIT_FLOOR, CIT_POLICIES];
  if (foodPlan !== 'none') routeCitations.push(CIT_DINING);
  if (needsAccessibility) routeCitations.push(CIT_ACCESS);

  return {
    planId: `aic-route-${Date.now()}`,
    museumId: intake.museumId || 'art-institute-of-chicago-us',
    visitDate: intake.visitDate || new Date().toISOString().split('T')[0],
    routeMode: withChildren ? 'family' : needsAccessibility ? 'accessible' : timeBudget >= 240 ? 'full' : 'highlights',
    confidence: 'prototype',
    entryEntranceId: entranceId,
    exitSuggestion: 'nearest-exit',
    totalDurationMinutes: totalDuration,
    summary: `A ${essentialCount}-zone gallery route through ${selectedGalleries.map(g => g.zone).filter((v, i, a) => a.indexOf(v) === i).join(', ')}${withChildren ? ' — adjusted for families' : ''}${needsAccessibility ? ' — with accessible paths' : ''}. ~${totalArtworks} works across ${gallerySteps.length} galleries.`,
    rationale,
    steps,
    citations: routeCitations,
  };
}
