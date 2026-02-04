/**
 * Parse year strings from artwork data and extract numeric years
 * Handles formats like: "1889", "c. 1870", "ca. 1866–67", "after 1479", "1890-1891"
 */
export function parseYearRange(yearStr: string): { start: number | null; end: number | null } {
  if (!yearStr || typeof yearStr !== 'string') {
    return { start: null, end: null };
  }

  // Remove common prefixes
  let cleaned = yearStr
    .replace(/^(c\.|ca\.|circa|about|around|after|before|early|late|mid-?)\s*/gi, '')
    .trim();

  // Handle ranges like "1890-1891" or "1866–67"
  const rangeMatch = cleaned.match(/(\d{3,4})\s*[-–—]\s*(\d{2,4})/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    let end = parseInt(rangeMatch[2], 10);
    
    // Handle abbreviated years like "1866–67" -> 1867
    if (end < 100) {
      const century = Math.floor(start / 100) * 100;
      end = century + end;
    }
    
    return { start, end };
  }

  // Handle single year
  const singleMatch = cleaned.match(/(\d{3,4})/);
  if (singleMatch) {
    const year = parseInt(singleMatch[1], 10);
    return { start: year, end: year };
  }

  return { start: null, end: null };
}

/**
 * Get the primary year (start year) from an artwork's year field
 */
export function getPrimaryYear(yearStr: string): number | null {
  const { start } = parseYearRange(yearStr);
  return start;
}

/**
 * Calculate time bucket based on granularity
 */
export type Granularity = 'century' | '50y' | '20y';

export function getTimeBucket(year: number, granularity: Granularity): { start: number; end: number; label: string } {
  let bucketSize: number;
  
  switch (granularity) {
    case 'century':
      bucketSize = 100;
      break;
    case '50y':
      bucketSize = 50;
      break;
    case '20y':
      bucketSize = 20;
      break;
  }

  const bucketStart = Math.floor(year / bucketSize) * bucketSize;
  const bucketEnd = bucketStart + bucketSize - 1;
  
  return {
    start: bucketStart,
    end: bucketEnd,
    label: `${bucketStart}–${bucketEnd}`,
  };
}

/**
 * Get all time buckets for a year range
 */
export function getTimeBuckets(
  minYear: number, 
  maxYear: number, 
  granularity: Granularity
): { start: number; end: number; label: string }[] {
  const buckets: { start: number; end: number; label: string }[] = [];
  let currentYear = minYear;
  
  while (currentYear <= maxYear) {
    const bucket = getTimeBucket(currentYear, granularity);
    if (!buckets.find(b => b.start === bucket.start)) {
      buckets.push(bucket);
    }
    currentYear = bucket.end + 1;
  }
  
  return buckets;
}
