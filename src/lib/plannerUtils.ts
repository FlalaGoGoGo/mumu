import { addDays, format, getDay, getDate, startOfMonth, startOfDay } from 'date-fns';
import { isOpenOnDay } from '@/lib/parseOpeningHours';
import { calculateDistance } from '@/lib/distance';
import type { Museum } from '@/types/museum';
import type { EligibilityItem } from '@/types/eligibility';

// ── Types ──

export interface TicketRuleEntry {
  currency: string;
  basePrice: number;
  pricingNotes: string;
  rules: TicketRule[];
}

export interface TicketRule {
  id: string;
  type: 'free' | 'discount';
  discountAmount?: number;
  eligibility: RuleEligibility | null;
  dateConstraint: DateConstraint | null;
  notes: string;
  requiresReservation?: boolean;
}

interface RuleEligibility {
  residentState?: string;
  residentCity?: string;
  residentRegion?: string;
  isStudent?: boolean;
  isSenior?: boolean;
  maxAge?: number;
  hasProgram?: string;
}

interface DateConstraint {
  dayOfWeek?: number[];
  weekRule?: 'first_full_weekend' | 'first_sunday' | 'first_saturday';
  monthRange?: number[];
  timeWindow?: string;
}

export interface OpenStatus {
  status: 'open' | 'closed' | 'unknown';
  note?: string;
}

export interface PriceResult {
  price: number | null;
  appliedRuleIds: string[];
  notes: string[];
  confidence: 'high' | 'low' | 'unknown';
  savings: number;
}

export interface ItineraryDay {
  date: Date;
  museums: ItineraryMuseum[];
}

export interface ItineraryMuseum {
  museum: Museum;
  openStatus: OpenStatus;
  priceResult: PriceResult;
  suggestedDuration: number; // hours
}

export interface TicketPlanItem {
  museum: Museum;
  bestPrice: PriceResult;
  basePrice: number | null;
  currency: string;
  pricingNotes: string;
  rulesAvailable: boolean;
}

// ── Date Utilities ──

export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = startOfDay(start);
  const endDay = startOfDay(end);
  while (current <= endDay) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

// ── Open Status ──

export function getMuseumOpenStatus(museum: Museum, date: Date): OpenStatus {
  if (!museum.opening_hours) {
    return { status: 'unknown', note: 'Hours not available' };
  }
  if (museum.opening_hours.toLowerCase().includes('temporarily closed')) {
    return { status: 'closed', note: 'Temporarily closed' };
  }
  const dayOfWeek = date.getDay();
  const open = isOpenOnDay(museum.opening_hours, dayOfWeek);
  return { status: open ? 'open' : 'closed' };
}

// ── Date Constraint Matching ──

function matchesDateConstraint(constraint: DateConstraint | null, date: Date): boolean {
  if (!constraint) return true;

  if (constraint.dayOfWeek && !constraint.dayOfWeek.includes(getDay(date))) {
    return false;
  }

  if (constraint.monthRange && !constraint.monthRange.includes(date.getMonth() + 1)) {
    return false;
  }

  if (constraint.weekRule) {
    const dayNum = getDate(date);
    const dow = getDay(date);
    const monthStart = startOfMonth(date);
    
    switch (constraint.weekRule) {
      case 'first_sunday': {
        // First Sunday of the month
        if (dow !== 0) return false;
        return dayNum <= 7;
      }
      case 'first_saturday': {
        if (dow !== 6) return false;
        return dayNum <= 7;
      }
      case 'first_full_weekend': {
        // First full weekend: first Saturday+Sunday pair where both are in the month
        if (dow !== 0 && dow !== 6) return false;
        // First Saturday is day 1-7 with dow=6
        const firstSatDay = ((6 - monthStart.getDay()) + 7) % 7 + 1;
        const firstSunDay = firstSatDay + 1;
        return dayNum === firstSatDay || dayNum === firstSunDay;
      }
    }
  }

  return true;
}

// ── Eligibility Matching ──

function getAgeFromDob(dob: string, onDate: Date): number {
  const birth = new Date(dob);
  let age = onDate.getFullYear() - birth.getFullYear();
  const m = onDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && onDate.getDate() < birth.getDate())) age--;
  return age;
}

export function matchesEligibility(
  ruleElig: RuleEligibility | null,
  userElig: EligibilityItem[],
  userLocations: { city: string; region: string; country: string },
  date: Date
): boolean {
  if (!ruleElig) return true; // No eligibility needed

  if (ruleElig.residentState) {
    const localResident = userElig.find(e => e.type === 'local_resident');
    const userState = userLocations.region;
    const localLocations = localResident?.locations || [];
    const matchState = userState === ruleElig.residentState ||
      localLocations.some(loc => loc.includes(ruleElig.residentState!));
    if (!matchState) return false;
  }

  if (ruleElig.residentCity) {
    const localResident = userElig.find(e => e.type === 'local_resident');
    const userCity = userLocations.city;
    const localLocations = localResident?.locations || [];
    const matchCity = userCity === ruleElig.residentCity ||
      localLocations.some(loc => loc.includes(ruleElig.residentCity!));
    if (!matchCity) return false;
  }

  if (ruleElig.isStudent) {
    if (!userElig.find(e => e.type === 'student')) return false;
  }

  if (ruleElig.isSenior) {
    const ageBased = userElig.find(e => e.type === 'age_based');
    if (!ageBased?.date_of_birth) return false;
    const age = getAgeFromDob(ageBased.date_of_birth, date);
    if (age < 65) return false;
  }

  if (ruleElig.maxAge !== undefined) {
    const ageBased = userElig.find(e => e.type === 'age_based');
    if (!ageBased?.date_of_birth) return false;
    const age = getAgeFromDob(ageBased.date_of_birth, date);
    if (age > ruleElig.maxAge) return false;
  }

  if (ruleElig.hasProgram) {
    if (!userElig.find(e => e.type === ruleElig.hasProgram)) return false;
  }

  return true;
}

// ── Pricing ──

export function computeEffectivePrice(
  museumId: string,
  date: Date,
  userElig: EligibilityItem[],
  userLocations: { city: string; region: string; country: string },
  ticketRules: Record<string, TicketRuleEntry>
): PriceResult {
  const entry = ticketRules[museumId];
  if (!entry) {
    return { price: null, appliedRuleIds: [], notes: ['Ticket rules not available yet'], confidence: 'unknown', savings: 0 };
  }

  let bestPrice = entry.basePrice;
  const appliedRuleIds: string[] = [];
  const notes: string[] = [];

  // Check for free rules first
  for (const rule of entry.rules) {
    if (rule.type === 'free' &&
        matchesDateConstraint(rule.dateConstraint, date) &&
        matchesEligibility(rule.eligibility, userElig, userLocations, date)) {
      return {
        price: 0,
        appliedRuleIds: [rule.id],
        notes: [rule.notes],
        confidence: 'high',
        savings: entry.basePrice,
      };
    }
  }

  // Check discount rules, pick best
  for (const rule of entry.rules) {
    if (rule.type === 'discount' && rule.discountAmount &&
        matchesDateConstraint(rule.dateConstraint, date) &&
        matchesEligibility(rule.eligibility, userElig, userLocations, date)) {
      const discountedPrice = Math.max(0, entry.basePrice - rule.discountAmount);
      if (discountedPrice < bestPrice) {
        bestPrice = discountedPrice;
        appliedRuleIds.length = 0;
        appliedRuleIds.push(rule.id);
        notes.length = 0;
        notes.push(rule.notes);
      }
    }
  }

  return {
    price: bestPrice,
    appliedRuleIds,
    notes: notes.length > 0 ? notes : [],
    confidence: 'high',
    savings: entry.basePrice - bestPrice,
  };
}

// ── Planner Modes ──

export interface PlannerInput {
  city: string;
  startDate: Date;
  endDate: Date;
  mode: 'money' | 'time';
  eligibility: EligibilityItem[];
  userLocations: { city: string; region: string; country: string };
  museums: Museum[];
  ticketRules: Record<string, TicketRuleEntry>;
}

export function generatePlan(input: PlannerInput): { itinerary: ItineraryDay[]; ticketPlan: TicketPlanItem[] } {
  const { city, startDate, endDate, mode, eligibility, userLocations, museums, ticketRules } = input;

  // Step A: Filter museums by city (if city provided), otherwise use all passed museums
  const cityMuseums = city ? museums.filter(m => m.city.toLowerCase() === city.toLowerCase()) : museums;
  const dates = getDateRange(startDate, endDate);

  // Compute price for each museum across all dates (best price)
  const museumPrices = new Map<string, { bestDate: Date; bestPrice: PriceResult; allDates: Map<string, PriceResult> }>();
  
  for (const museum of cityMuseums) {
    const allDates = new Map<string, PriceResult>();
    let bestPrice: PriceResult | null = null;
    let bestDate = dates[0];
    
    for (const date of dates) {
      const price = computeEffectivePrice(museum.museum_id, date, eligibility, userLocations, ticketRules);
      allDates.set(format(date, 'yyyy-MM-dd'), price);
      if (!bestPrice || (price.price !== null && (bestPrice.price === null || price.price < bestPrice.price))) {
        bestPrice = price;
        bestDate = date;
      }
    }
    
    museumPrices.set(museum.museum_id, { bestDate, bestPrice: bestPrice!, allDates });
  }

  // Assign museums to days
  const itinerary: ItineraryDay[] = [];
  const assigned = new Set<string>();

  if (mode === 'money') {
    // Score museums: free=100, discounted=savings, unknown=5, closed=skip
    const scored = cityMuseums.map(m => {
      const priceData = museumPrices.get(m.museum_id)!;
      let bestScore = -1;
      let bestDateForMuseum = dates[0];
      
      for (const date of dates) {
        const status = getMuseumOpenStatus(m, date);
        if (status.status === 'closed') continue;
        
        const price = priceData.allDates.get(format(date, 'yyyy-MM-dd'))!;
        let score = 0;
        if (price.price === null) score = 5;
        else if (price.price === 0) score = 100;
        else score = price.savings;
        
        if (score > bestScore) {
          bestScore = score;
          bestDateForMuseum = date;
        }
      }
      
      return { museum: m, score: bestScore, bestDate: bestDateForMuseum };
    }).filter(s => s.score >= 0).sort((a, b) => b.score - a.score);

    for (const date of dates) {
      const dayMuseums: ItineraryMuseum[] = [];
      
      for (const s of scored) {
        if (assigned.has(s.museum.museum_id)) continue;
        if (dayMuseums.length >= 2) break;
        
        const status = getMuseumOpenStatus(s.museum, date);
        if (status.status === 'closed') continue;
        
        const priceKey = format(date, 'yyyy-MM-dd');
        const priceResult = museumPrices.get(s.museum.museum_id)!.allDates.get(priceKey)!;
        
        // Prefer assigning on best date
        if (format(s.bestDate, 'yyyy-MM-dd') === priceKey || dayMuseums.length < 1) {
          dayMuseums.push({
            museum: s.museum,
            openStatus: status,
            priceResult,
            suggestedDuration: 2,
          });
          assigned.add(s.museum.museum_id);
        }
      }
      
      itinerary.push({ date, museums: dayMuseums });
    }
  } else {
    // Time mode: cluster by proximity
    const unassigned = [...cityMuseums];
    
    for (const date of dates) {
      if (unassigned.length === 0) break;
      const dayMuseums: ItineraryMuseum[] = [];
      
      // Pick first available open museum
      let anchor: Museum | null = null;
      for (let i = 0; i < unassigned.length; i++) {
        const status = getMuseumOpenStatus(unassigned[i], date);
        if (status.status !== 'closed') {
          anchor = unassigned.splice(i, 1)[0];
          break;
        }
      }
      
      if (anchor) {
        const anchorStatus = getMuseumOpenStatus(anchor, date);
        const priceKey = format(date, 'yyyy-MM-dd');
        dayMuseums.push({
          museum: anchor,
          openStatus: anchorStatus,
          priceResult: museumPrices.get(anchor.museum_id)?.allDates.get(priceKey) || { price: null, appliedRuleIds: [], notes: [], confidence: 'unknown', savings: 0 },
          suggestedDuration: 2,
        });
        assigned.add(anchor.museum_id);
        
        // Find nearest open museum
        let bestIdx = -1;
        let bestDist = Infinity;
        for (let i = 0; i < unassigned.length; i++) {
          const status = getMuseumOpenStatus(unassigned[i], date);
          if (status.status === 'closed') continue;
          const dist = calculateDistance(anchor.lat, anchor.lng, unassigned[i].lat, unassigned[i].lng);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = i;
          }
        }
        
        if (bestIdx >= 0) {
          const neighbor = unassigned.splice(bestIdx, 1)[0];
          dayMuseums.push({
            museum: neighbor,
            openStatus: getMuseumOpenStatus(neighbor, date),
            priceResult: museumPrices.get(neighbor.museum_id)?.allDates.get(priceKey) || { price: null, appliedRuleIds: [], notes: [], confidence: 'unknown', savings: 0 },
            suggestedDuration: 2,
          });
          assigned.add(neighbor.museum_id);
        }
      }
      
      itinerary.push({ date, museums: dayMuseums });
    }
    
    // Fill remaining days
    while (itinerary.length < dates.length) {
      itinerary.push({ date: dates[itinerary.length], museums: [] });
    }
  }

  // Build ticket plan
  const ticketPlan: TicketPlanItem[] = [];
  const allAssigned = new Set<string>();
  
  for (const day of itinerary) {
    for (const im of day.museums) {
      if (allAssigned.has(im.museum.museum_id)) continue;
      allAssigned.add(im.museum.museum_id);
      
      const entry = ticketRules[im.museum.museum_id];
      ticketPlan.push({
        museum: im.museum,
        bestPrice: im.priceResult,
        basePrice: entry?.basePrice ?? null,
        currency: entry?.currency ?? 'USD',
        pricingNotes: entry?.pricingNotes ?? '',
        rulesAvailable: !!entry,
      });
    }
  }

  return { itinerary, ticketPlan };
}
