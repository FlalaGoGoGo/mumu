export interface Stop {
  id: string;
  region?: string;
  country?: string;
  state?: string;
  city?: string;
  radiusKm: number; // default 25
}

export interface Visit {
  id: string;
  name: string;
  dateMode: 'fixed' | 'flexible';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  flexibleDays?: number; // 1-10

  timeBudgetMode: 'all_day' | 'time_window';
  dailyTimeWindow?: { start: string; end: string }; // "14:00" - "17:00"

  stops: Stop[];
  mode: 'money' | 'time';

  generatedAt?: string;
  itinerary?: any;
  ticketPlan?: any;
  routeGeoJson?: any;

  createdAt: string;
  updatedAt: string;
}
