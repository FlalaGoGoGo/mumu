/**
 * AIC-specific discount rules and next-eligible computation.
 * All times computed in America/Chicago timezone.
 */

import type { EligibilityItem } from '@/types/eligibility';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DiscountRow {
  id: string;
  icon: string;
  name: string;
  description?: string;
  qualifies: boolean;
  applicableNow: boolean;
  yourPrice: number;           // computed price ($0 for free, base otherwise)
  basePrice: number;
  statusLabel: string;         // "Valid now" | "Not today" | "Seasonal" etc.
  statusVariant: 'valid' | 'inactive' | 'seasonal' | 'info';
  nextEligible?: string;       // formatted date string
  note?: string;               // helper text
}

export interface DiscountInput {
  /** Eligibility items from user preferences */
  eligibilities: EligibilityItem[];
  /** Selected ticket category base price */
  basePrice: number;
  /** Selected ticket category id */
  ticketCategory: string;
  /** Current date/time in Chicago */
  now: Date;
  /** Museum hours for weekday lookup */
  hours: { day: string; hours: string }[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TZ = 'America/Chicago';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// Free winter weekdays date window
const WINTER_FREE_START = new Date(2026, 0, 5); // Jan 5 2026
const WINTER_FREE_END = new Date(2026, 1, 28);  // Feb 28 2026

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Get a Date in Chicago TZ components */
function chicagoDate(d: Date) {
  const str = d.toLocaleString('en-US', { timeZone: TZ });
  return new Date(str);
}

function chicagoWeekday(d: Date): number {
  return chicagoDate(d).getDay();
}

function chicagoHour(d: Date): number {
  return chicagoDate(d).getHours();
}

function isMuseumOpen(hours: { day: string; hours: string }[], d: Date): boolean {
  const weekday = chicagoWeekday(d);
  const abbr = DAY_ABBR[weekday];
  const match = hours.find(h => h.day === abbr);
  return !!match && match.hours.toLowerCase() !== 'closed';
}

function isMuseumOpenNow(hours: { day: string; hours: string }[], d: Date): boolean {
  if (!isMuseumOpen(hours, d)) return false;
  const h = chicagoHour(d);
  // Museum opens at 11
  return h >= 11;
}

function getClosingHour(hours: { day: string; hours: string }[], d: Date): number {
  const weekday = chicagoWeekday(d);
  const abbr = DAY_ABBR[weekday];
  const match = hours.find(h => h.day === abbr);
  if (!match) return 17;
  // Parse "11–5" or "11–8"
  const parts = match.hours.replace(/[^0-9–-]/g, '').split(/[–-]/);
  const close = parseInt(parts[1] || '17', 10);
  return close <= 12 ? close + 12 : close; // handle PM times
}

/** Format a date nicely: "Thu, Feb 12 • 11:00 AM" */
function formatNextEligible(d: Date): string {
  const chicago = chicagoDate(d);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  const dateStr = chicago.toLocaleDateString('en-US', opts);
  const timeStr = chicago.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} • ${timeStr}`;
}

/** Get next open day starting from tomorrow */
function nextOpenDay(hours: { day: string; hours: string }[], from: Date): Date {
  const d = new Date(from);
  for (let i = 0; i < 14; i++) {
    d.setDate(d.getDate() + 1);
    if (isMuseumOpen(hours, d)) {
      d.setHours(11, 0, 0, 0);
      return d;
    }
  }
  d.setHours(11, 0, 0, 0);
  return d;
}

/** Get first full weekend (Sat+Sun) of a month */
function getFirstFullWeekend(year: number, month: number): { sat: Date; sun: Date } {
  // Find first Saturday
  let d = new Date(year, month, 1);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  const sat = new Date(d);
  const sun = new Date(d);
  sun.setDate(sun.getDate() + 1);
  // Verify sun is still in same month
  if (sun.getMonth() !== month) {
    // First Saturday is last day of month, first FULL weekend is next month
    // Actually the "first full weekend" means both Sat and Sun fall in the month
    sat.setDate(sat.getDate() + 7);
    sun.setDate(sat.getDate() + 1);
  }
  return { sat, sun };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function hasEligibility(eligibilities: EligibilityItem[], type: string): boolean {
  return eligibilities.some(e => e.type === type);
}

function isIllinoisResident(eligibilities: EligibilityItem[]): boolean {
  const localRes = eligibilities.find(e => e.type === 'local_resident');
  if (localRes?.locations) {
    return localRes.locations.some(loc => loc.includes('Illinois'));
  }
  return false;
}

function isChicagoResident(eligibilities: EligibilityItem[]): boolean {
  const localRes = eligibilities.find(e => e.type === 'local_resident');
  if (localRes?.locations) {
    return localRes.locations.some(loc => loc.includes('Chicago'));
  }
  return false;
}

function getAgeFromDOB(eligibilities: EligibilityItem[]): number | null {
  const ageItem = eligibilities.find(e => e.type === 'age_based');
  if (!ageItem?.date_of_birth) return null;
  const dob = new Date(ageItem.date_of_birth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// ── Main computation ───────────────────────────────────────────────────────────

export function computeDiscountRows(input: DiscountInput): DiscountRow[] {
  const { eligibilities, basePrice, ticketCategory, now, hours } = input;
  const chicago = chicagoDate(now);
  const rows: DiscountRow[] = [];
  const openToday = isMuseumOpen(hours, now);
  const openNow = isMuseumOpenNow(hours, now);

  // Helper for "always free" groups
  const alwaysFreeRow = (
    id: string,
    icon: string,
    name: string,
    qualifies: boolean,
  ): DiscountRow => {
    let statusLabel = 'Not eligible';
    let statusVariant: DiscountRow['statusVariant'] = 'inactive';
    let nextEligible: string | undefined;

    if (qualifies) {
      if (openNow) {
        statusLabel = 'Valid now';
        statusVariant = 'valid';
      } else if (openToday) {
        const h = chicagoHour(now);
        if (h < 11) {
          statusLabel = 'Not yet today';
          statusVariant = 'inactive';
          const todayOpen = new Date(chicago);
          todayOpen.setHours(11, 0, 0, 0);
          nextEligible = formatNextEligible(todayOpen);
        } else {
          statusLabel = 'Closed for today';
          statusVariant = 'inactive';
          const next = nextOpenDay(hours, now);
          nextEligible = formatNextEligible(next);
        }
      } else {
        statusLabel = 'Not today (museum closed)';
        statusVariant = 'inactive';
        const next = nextOpenDay(hours, now);
        nextEligible = formatNextEligible(next);
      }
    }

    return {
      id,
      icon,
      name,
      qualifies,
      applicableNow: qualifies && openNow,
      yourPrice: qualifies ? 0 : basePrice,
      basePrice,
      statusLabel,
      statusVariant,
      nextEligible,
    };
  };

  // 4.1A — Children < 14
  const age = getAgeFromDOB(eligibilities);
  const isChild = ticketCategory === 'child' || (age !== null && age < 14);
  rows.push(alwaysFreeRow('child_free', '👶', 'Children under 14', isChild));

  // 4.1B — Chicago Teen
  const isTeen = ticketCategory === 'teen' || (age !== null && age >= 14 && age < 18);
  const chicagoTeen = isTeen && isChicagoResident(eligibilities);
  rows.push(alwaysFreeRow('chicago_teen', '🏙️', 'Chicago Resident Teen (14–17)', chicagoTeen));

  // 4.1C — LINK/WIC (SNAP/EBT)
  const hasLinkWic = hasEligibility(eligibilities, 'snap_ebt');
  rows.push(alwaysFreeRow('link_wic', '🏛️', 'LINK / WIC (Museums for All)', hasLinkWic));

  // 4.1D — Active-duty Military
  const hasMilitary = hasEligibility(eligibilities, 'military') || hasEligibility(eligibilities, 'blue_star');
  rows.push(alwaysFreeRow('military', '🎖️', 'Active-duty Military', hasMilitary));

  // 4.1E — Illinois Educator
  const hasTeacher = hasEligibility(eligibilities, 'teacher');
  const isILEducator = hasTeacher && isIllinoisResident(eligibilities);
  rows.push(alwaysFreeRow('il_educator', '📝', 'Illinois Educator', isILEducator));

  // 4.2 — Free Winter Weekdays (Illinois Residents)
  const ilResident = isIllinoisResident(eligibilities);
  {
    const inDateRange =
      chicago >= WINTER_FREE_START && chicago <= WINTER_FREE_END;
    const weekday = chicagoWeekday(now);
    const isOpenWeekday = [1, 3, 4, 5].includes(weekday); // Mon, Wed, Thu, Fri
    let statusLabel = 'Not eligible';
    let statusVariant: DiscountRow['statusVariant'] = 'inactive';
    let nextEligible: string | undefined;
    const qualifies = ilResident;

    if (qualifies) {
      if (!inDateRange) {
        statusLabel = 'Seasonal (not active now)';
        statusVariant = 'seasonal';
      } else if (isOpenWeekday && openToday) {
        const h = chicagoHour(now);
        if (h < 11) {
          statusLabel = 'Not yet. Starts at 11:00 today.';
          statusVariant = 'inactive';
          const todayOpen = new Date(chicago);
          todayOpen.setHours(11, 0, 0, 0);
          nextEligible = formatNextEligible(todayOpen);
        } else if (h < getClosingHour(hours, now)) {
          statusLabel = 'Valid now';
          statusVariant = 'valid';
        } else {
          statusLabel = 'Closed for today';
          statusVariant = 'inactive';
          // Find next valid weekday in range
          const next = findNextWinterWeekday(hours, now);
          if (next) nextEligible = formatNextEligible(next);
        }
      } else {
        statusLabel = 'Not today';
        statusVariant = 'inactive';
        const next = findNextWinterWeekday(hours, now);
        if (next) nextEligible = formatNextEligible(next);
      }
    }

    rows.push({
      id: 'winter_free',
      icon: '❄️',
      name: 'Free Winter Weekdays (IL Residents)',
      description: 'Jan 5 – Feb 28, 2026 · Open weekdays only',
      qualifies,
      applicableNow: qualifies && statusVariant === 'valid',
      yourPrice: qualifies && statusVariant === 'valid' ? 0 : basePrice,
      basePrice,
      statusLabel,
      statusVariant,
      nextEligible,
    });
  }

  // 4.3 — Bank of America Museums on Us
  const hasBoa = hasEligibility(eligibilities, 'bofa_museums_on_us');
  {
    const { sat, sun } = getFirstFullWeekend(chicago.getFullYear(), chicago.getMonth());
    const isFirstFullWeekend = isSameDay(chicago, sat) || isSameDay(chicago, sun);
    let statusLabel = 'Not eligible';
    let statusVariant: DiscountRow['statusVariant'] = 'inactive';
    let nextEligible: string | undefined;

    if (hasBoa) {
      if (isFirstFullWeekend && openNow) {
        statusLabel = 'Valid now';
        statusVariant = 'valid';
      } else if (isFirstFullWeekend && openToday) {
        const h = chicagoHour(now);
        if (h < 11) {
          statusLabel = 'Not yet. Opens at 11:00 today.';
          statusVariant = 'inactive';
          const todayOpen = new Date(chicago);
          todayOpen.setHours(11, 0, 0, 0);
          nextEligible = formatNextEligible(todayOpen);
        } else {
          statusLabel = 'Closed for today';
          statusVariant = 'inactive';
          nextEligible = getNextBoaWeekend(chicago);
        }
      } else {
        statusLabel = 'Not today';
        statusVariant = 'inactive';
        nextEligible = getNextBoaWeekend(chicago);
      }
    }

    rows.push({
      id: 'boa',
      icon: '💳',
      name: 'Bank of America — Museums on Us',
      note: 'General admission only; bring eligible card + photo ID.',
      qualifies: hasBoa,
      applicableNow: hasBoa && statusVariant === 'valid',
      yourPrice: hasBoa && statusVariant === 'valid' ? 0 : basePrice,
      basePrice,
      statusLabel,
      statusVariant,
      nextEligible,
    });
  }

  // 4.5 — CPL Kids Museum Passport
  const hasCpl = eligibilities.some(
    e => e.type === 'library_pass' && e.libraries?.some(l => l.toLowerCase().includes('chicago'))
  );
  {
    let statusLabel = 'Not eligible';
    let statusVariant: DiscountRow['statusVariant'] = 'inactive';

    if (hasCpl) {
      if (openNow) {
        statusLabel = 'May be valid today';
        statusVariant = 'info';
      } else {
        statusLabel = 'Program-based; verify at venue';
        statusVariant = 'info';
      }
    }

    rows.push({
      id: 'cpl_passport',
      icon: '📚',
      name: 'CPL Kids Museum Passport',
      note: 'Family admission through Chicago Public Library',
      qualifies: hasCpl,
      applicableNow: false, // never guaranteed
      yourPrice: hasCpl ? 0 : basePrice,
      basePrice,
      statusLabel,
      statusVariant,
    });
  }

  return rows;
}

// ── Member note helper ─────────────────────────────────────────────────────────

export function getMemberNote(eligibilities: EligibilityItem[]): {
  isMember: boolean;
  text: string;
} {
  const hasMembership = eligibilities.some(
    e => e.type === 'museum_membership' && e.museum_memberships?.some(m => m.museum_id === 'museum_00001')
  );
  return {
    isMember: hasMembership,
    text: hasMembership
      ? 'Member-only hour: 10–11 a.m. daily (quieter viewing).'
      : '10–11 a.m. is reserved for members.',
  };
}

// ── Next-eligible helpers ──────────────────────────────────────────────────────

function findNextWinterWeekday(hours: { day: string; hours: string }[], from: Date): Date | null {
  const d = new Date(chicagoDate(from));
  for (let i = 0; i < 60; i++) {
    d.setDate(d.getDate() + 1);
    if (d > WINTER_FREE_END) return null;
    if (d < WINTER_FREE_START) continue;
    const wd = d.getDay();
    if ([1, 3, 4, 5].includes(wd) && isMuseumOpen(hours, d)) {
      d.setHours(11, 0, 0, 0);
      return d;
    }
  }
  return null;
}

function getNextBoaWeekend(from: Date): string {
  let year = from.getFullYear();
  let month = from.getMonth();
  // Check current month first, then next
  for (let i = 0; i < 3; i++) {
    const m = (month + i) % 12;
    const y = month + i >= 12 ? year + 1 : year;
    const { sat } = getFirstFullWeekend(y, m);
    if (sat > from) {
      sat.setHours(11, 0, 0, 0);
      return formatNextEligible(sat);
    }
  }
  return '';
}

// ── Ticket categories ──────────────────────────────────────────────────────────

export const TICKET_CATEGORIES = [
  { id: 'adult', label: 'Adult', defaultPrice: 40 },
  { id: 'senior', label: 'Senior (65+)', defaultPrice: 34 },
  { id: 'student', label: 'Student', defaultPrice: 34 },
  { id: 'teen', label: 'Teen (14–17)', defaultPrice: 34 },
  { id: 'child', label: 'Child (<14)', defaultPrice: 0 },
] as const;

export function getBasePriceFromAdmission(
  admission: { category: string; price: string }[],
  ticketId: string,
): number {
  const map: Record<string, string> = {
    adult: 'Adult',
    senior: 'Seniors (65+)',
    student: 'Students',
    teen: 'Teens (14–17)',
    child: 'Children',
  };
  const label = map[ticketId] || 'Adult';
  const match = admission.find(a => a.category === label);
  if (!match) return 40;
  const num = parseInt(match.price.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}
