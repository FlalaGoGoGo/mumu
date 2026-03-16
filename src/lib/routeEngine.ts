/**
 * Client-side route generation engine for museum visits.
 * Generates deterministic routes based on intake preferences.
 * Future: replaced by backend AI route planner.
 */
import type { VisitIntake, RoutePlan, RouteStep, ArtworkRef, Citation } from '@/types/museumDetail';

const CITATION_FLOOR_PLAN: Citation = {
  id: 'floor-plan', label: 'AIC Museum Floor Plan',
  url: 'https://www.artic.edu/visit/explore-on-your-own/museum-floor-plan',
  sourceKind: 'official_live', accessedAt: '2026-03-15',
};
const CITATION_POLICIES: Citation = {
  id: 'visitor-policies', label: 'AIC Visitor Policies',
  url: 'https://www.artic.edu/visit/visitor-policies',
  sourceKind: 'official_live', accessedAt: '2026-03-15',
};
const CITATION_DINING: Citation = {
  id: 'dining-shopping', label: 'AIC Dining and Shopping',
  url: 'https://www.artic.edu/visit/dining-and-shopping',
  sourceKind: 'official_live', accessedAt: '2026-03-15',
};
const CITATION_ACCESSIBILITY: Citation = {
  id: 'accessibility', label: 'AIC Accessibility',
  url: 'https://www.artic.edu/visit/accessibility',
  sourceKind: 'official_live', accessedAt: '2026-03-15',
};

interface GalleryStop {
  galleryNumber: string;
  floor: string;
  zone: string;
  durationBase: number; // minutes at steady pace
  artworks: ArtworkRef[];
  priority: number; // lower = higher priority
  familyFriendly: boolean;
  accessible: boolean;
}

function buildGalleryStops(artworks: ArtworkRef[]): GalleryStop[] {
  const onView = artworks.filter(a => a.isOnView && a.galleryNumber);
  const byGallery = new Map<string, ArtworkRef[]>();
  for (const a of onView) {
    const key = a.galleryNumber!;
    if (!byGallery.has(key)) byGallery.set(key, []);
    byGallery.get(key)!.push(a);
  }

  const stops: GalleryStop[] = [];
  for (const [num, arts] of byGallery) {
    const hasMustSee = arts.some(a => a.mustSee);
    stops.push({
      galleryNumber: num,
      floor: arts[0].floor || '2',
      zone: num === '262' ? 'Modern and American painting' : num === '201' ? 'Impressionist painting' : 'European painting sequence',
      durationBase: hasMustSee ? 20 : 15,
      artworks: arts,
      priority: hasMustSee ? 1 : 3,
      familyFriendly: true,
      accessible: true,
    });
  }

  return stops.sort((a, b) => a.priority - b.priority);
}

export function generateRoute(
  intake: Partial<VisitIntake>,
  allArtworks: ArtworkRef[],
): RoutePlan {
  const timeBudget = intake.timeBudgetMinutes || 120;
  const withChildren = intake.withChildren || false;
  const needsAccessibility = intake.needsAccessibility || false;
  const largeBags = intake.largeBags || false;
  const foodPlan = intake.foodPlan || 'none';
  const pace = intake.pace || 'steady';
  const entranceId = intake.entryEntranceId || 'michigan-avenue';

  // Pace multiplier
  const paceMultiplier = pace === 'slow' ? 1.4 : pace === 'fast' ? 0.7 : 1.0;
  const childMultiplier = withChildren ? 1.3 : 1.0;
  const accessMultiplier = needsAccessibility ? 1.2 : 1.0;

  // Time budget: subtract entrance + exit overhead
  const entranceTime = largeBags ? 15 : 8;
  const exitTime = 5;
  const foodTime = foodPlan === 'none' ? 0 : foodPlan === 'coffee_break' ? 15 : foodPlan === 'light_meal' ? 25 : foodPlan === 'full_meal' ? 45 : 15;
  const availableGalleryTime = timeBudget - entranceTime - exitTime - foodTime;

  // Build gallery stops and select based on time
  const allStops = buildGalleryStops(allArtworks);
  const selectedStops: GalleryStop[] = [];
  let usedTime = 0;

  for (const stop of allStops) {
    const adjustedDuration = Math.round(stop.durationBase * paceMultiplier * childMultiplier * accessMultiplier);
    const walkTime = selectedStops.length === 0 ? 8 : needsAccessibility ? 8 : 5;
    const totalForStop = adjustedDuration + walkTime;

    if (usedTime + totalForStop > availableGalleryTime) {
      // For short visits, always include at least 1 must-see
      if (selectedStops.length === 0 && stop.priority === 1) {
        selectedStops.push(stop);
        usedTime += totalForStop;
      }
      break;
    }
    selectedStops.push(stop);
    usedTime += totalForStop;
  }

  // Build route steps
  const steps: RouteStep[] = [];
  let order = 1;

  // Step 1: Entrance
  const entranceName = entranceId === 'modern-wing' ? 'Modern Wing Entrance' : 'Michigan Avenue Entrance';
  const entranceSubtitle = largeBags
    ? 'Check your large bag at the free checkroom before starting'
    : withChildren
    ? 'Pick up a family guide and get settled'
    : 'Pick up a map and head to floor 2';

  const entranceFacilities: RouteStep['nearbyFacilities'] = [
    { key: 'restroom', label: 'Entry-level restrooms' },
  ];
  if (largeBags) entranceFacilities.unshift({ key: 'checkroom', label: 'Free checkroom at entrance' });
  if (withChildren) entranceFacilities.push({ key: 'family_restroom', label: 'Family restrooms nearby' });
  if (needsAccessibility) entranceFacilities.push({ key: 'wheelchair', label: 'Free wheelchairs available' });

  steps.push({
    stepId: `step-${order}`,
    order: order++,
    type: 'entrance',
    title: `Enter via ${entranceName.replace(' Entrance', '')}`,
    subtitle: entranceSubtitle,
    location: { label: entranceName, floor: '1', galleryId: null, galleryNumber: null, zone: 'Main entry' },
    durationMinutes: entranceTime,
    walkMinutesFromPrevious: 0,
    whyThisStop: largeBags
      ? 'Start here to check oversized bags before entering galleries. The checkroom is free.'
      : entranceId === 'modern-wing'
      ? 'The Modern Wing entrance provides direct access to contemporary galleries and the Ryan Learning Center.'
      : 'The main entrance provides the clearest arrival path for first-time visitors.',
    primaryObjects: [],
    nearbyFacilities: entranceFacilities,
    replanHints: ['If the line is long, you can still follow this route — just trim the last optional stop.'],
    citations: [CITATION_POLICIES, CITATION_FLOOR_PLAN],
  });

  // Gallery stops
  for (let i = 0; i < selectedStops.length; i++) {
    const stop = selectedStops[i];
    const adjustedDuration = Math.round(stop.durationBase * paceMultiplier * childMultiplier * accessMultiplier);
    const walkTime = i === 0 ? 8 : needsAccessibility ? 8 : 5;
    const isOptional = stop.priority > 1 && i >= 2;

    const facilities: RouteStep['nearbyFacilities'] = [];
    if (needsAccessibility) facilities.push({ key: 'elevator', label: 'Elevator access on this floor' });
    facilities.push({ key: 'restroom', label: 'Nearby restrooms' });
    if (withChildren && i === 0) facilities.push({ key: 'quiet_space', label: 'Bench seating available' });

    const artCitations: Citation[] = stop.artworks.slice(0, 2).map(a => ({
      id: `artwork-${a.id}`,
      label: `AIC Artwork ${a.id}`,
      url: a.apiUrl || a.museumPageUrl || '',
      sourceKind: 'official_api' as const,
      accessedAt: '2026-03-15',
    }));

    steps.push({
      stepId: `step-${order}`,
      order: order++,
      type: 'gallery',
      title: `Gallery ${stop.galleryNumber}${stop.artworks[0]?.artistTitle ? ` — ${stop.artworks[0].artistTitle}` : ''}`,
      subtitle: isOptional ? 'Optional — skip if running short on time' : stop.artworks.find(a => a.mustSee)?.shortDescription || `${stop.artworks.length} work${stop.artworks.length > 1 ? 's' : ''} to see here`,
      location: {
        label: `Gallery ${stop.galleryNumber}`,
        floor: stop.floor,
        galleryId: stop.artworks[0]?.galleryId || null,
        galleryNumber: stop.galleryNumber,
        zone: stop.zone,
      },
      durationMinutes: adjustedDuration,
      walkMinutesFromPrevious: walkTime,
      whyThisStop: stop.artworks.find(a => a.mustSee)
        ? `This gallery contains must-see works and is a high-priority stop.`
        : `A supporting stop that complements the route with ${withChildren ? 'family-friendly' : 'additional'} works.`,
      primaryObjects: stop.artworks,
      nearbyFacilities: facilities,
      replanHints: isOptional
        ? ['This is an optional stop — skip it first if you need more time.']
        : ['If running behind, spend less time here but don\'t skip entirely.'],
      citations: artCitations,
    });
  }

  // Food stop
  if (foodPlan !== 'none') {
    const foodLabels: Record<string, string> = {
      coffee_break: 'Coffee break',
      light_meal: 'Light meal',
      full_meal: 'Full meal at Terzo Piano',
      flexible: 'Quick refreshment stop',
    };
    steps.push({
      stepId: `step-${order}`,
      order: order++,
      type: 'meal',
      title: foodLabels[foodPlan] || 'Refreshment stop',
      subtitle: foodPlan === 'full_meal' ? 'Reserve time for a sit-down meal' : 'A quick break before wrapping up',
      location: {
        label: foodPlan === 'full_meal' ? 'Terzo Piano, Modern Wing' : 'Café Moderno or Modern Bar',
        floor: foodPlan === 'full_meal' ? '3' : '2',
        galleryId: null, galleryNumber: null,
        zone: 'Modern Wing',
      },
      durationMinutes: foodTime,
      walkMinutesFromPrevious: 4,
      whyThisStop: `You indicated you'd like a ${foodPlan.replace('_', ' ')} during your visit.`,
      primaryObjects: [],
      nearbyFacilities: [
        { key: 'cafe', label: foodPlan === 'full_meal' ? 'Terzo Piano' : 'Café Moderno' },
        { key: 'restroom', label: 'Nearby restrooms' },
      ],
      replanHints: ['Drop this step first if the route falls behind schedule.'],
      citations: [CITATION_DINING],
    });
  }

  // Exit
  steps.push({
    stepId: `step-${order}`,
    order: order++,
    type: 'exit',
    title: 'Exit the museum',
    subtitle: largeBags ? 'Pick up your bag from the checkroom' : undefined,
    location: { label: 'Nearest exit', floor: '1', galleryId: null, galleryNumber: null, zone: 'Exit' },
    durationMinutes: exitTime,
    walkMinutesFromPrevious: 5,
    whyThisStop: 'End of route.',
    primaryObjects: [],
    nearbyFacilities: largeBags ? [{ key: 'checkroom', label: 'Collect your bag' }] : [],
    replanHints: [],
    citations: [],
  });

  // Compute total
  const totalDuration = steps.reduce((sum, s) => sum + s.durationMinutes + s.walkMinutesFromPrevious, 0);

  // Build rationale
  const rationale: string[] = [];
  rationale.push(`Route planned for ~${timeBudget} minutes at a ${pace} pace.`);
  if (withChildren) rationale.push('Adjusted for a family visit with extra time at each stop.');
  if (needsAccessibility) rationale.push('Prioritizes elevator-accessible paths and allows extra walking time.');
  if (largeBags) rationale.push('Includes a bag-check step at the entrance.');
  if (foodPlan !== 'none') rationale.push(`Includes a ${foodPlan.replace('_', ' ')} stop.`);
  rationale.push(`This route covers ${selectedStops.length} gallery stop${selectedStops.length !== 1 ? 's' : ''} on floor 2.`);

  const routeCitations: Citation[] = [CITATION_FLOOR_PLAN, CITATION_POLICIES];
  if (foodPlan !== 'none') routeCitations.push(CITATION_DINING);
  if (needsAccessibility) routeCitations.push(CITATION_ACCESSIBILITY);

  return {
    planId: `aic-route-${Date.now()}`,
    museumId: intake.museumId || 'art-institute-of-chicago-us',
    visitDate: intake.visitDate || new Date().toISOString().split('T')[0],
    routeMode: withChildren ? 'family' : needsAccessibility ? 'accessible' : 'highlights',
    confidence: 'prototype',
    entryEntranceId: entranceId,
    exitSuggestion: 'nearest-exit',
    totalDurationMinutes: totalDuration,
    summary: `A ${selectedStops.length}-stop route covering ${pace === 'fast' ? 'key highlights' : 'iconic paintings'} on floor 2${withChildren ? ', adjusted for families' : ''}${needsAccessibility ? ', with accessible paths' : ''}.`,
    rationale,
    steps,
    citations: routeCitations,
  };
}
