/**
 * Parses opening_hours string to determine if museum is open on a given day.
 * Format examples:
 * - "Mon 11-5; Wed 11-5; Thu 11-8; Fri-Sun 11-5"
 * - "Mon-Sun 10-5"
 * - "Tue-Fri 10-6:30; Sat 10-9; Sun 10-6:30"
 */

const DAY_MAP: Record<string, number> = {
  'sun': 0,
  'mon': 1,
  'tue': 2,
  'wed': 3,
  'thu': 4,
  'fri': 5,
  'sat': 6,
};

const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function expandDayRange(dayStr: string): number[] {
  const normalized = dayStr.toLowerCase().trim();
  
  // Check for range like "Mon-Fri" or "Fri-Sun"
  const rangeMatch = normalized.match(/^([a-z]{3})-([a-z]{3})$/);
  if (rangeMatch) {
    const startDay = DAY_MAP[rangeMatch[1]];
    const endDay = DAY_MAP[rangeMatch[2]];
    
    if (startDay === undefined || endDay === undefined) return [];
    
    const days: number[] = [];
    if (startDay <= endDay) {
      for (let i = startDay; i <= endDay; i++) {
        days.push(i);
      }
    } else {
      // Wrap around (e.g., Fri-Sun = 5,6,0)
      for (let i = startDay; i <= 6; i++) {
        days.push(i);
      }
      for (let i = 0; i <= endDay; i++) {
        days.push(i);
      }
    }
    return days;
  }
  
  // Single day
  const singleDay = DAY_MAP[normalized];
  if (singleDay !== undefined) {
    return [singleDay];
  }
  
  return [];
}

/**
 * Returns true if the museum is open on the given day of week (0=Sunday, 6=Saturday)
 */
export function isOpenOnDay(openingHours: string | null, dayOfWeek: number): boolean {
  if (!openingHours) return false;
  
  // Split by semicolon to get individual day entries
  const entries = openingHours.split(';').map(e => e.trim());
  
  for (const entry of entries) {
    // Extract the day part (before the time)
    // Format: "Mon 11-5" or "Mon-Fri 10-5"
    const match = entry.match(/^([A-Za-z-]+)\s+\d/);
    if (!match) continue;
    
    const dayPart = match[1];
    const days = expandDayRange(dayPart);
    
    if (days.includes(dayOfWeek)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Returns true if the museum is open today
 */
export function isOpenToday(openingHours: string | null): boolean {
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  return isOpenOnDay(openingHours, today);
}
