import { useState, useEffect, useCallback } from 'react';
import type { Visit, Stop } from '@/types/visit';

const STORAGE_KEY = 'mumu_visit_plans';

function loadVisits(): Visit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVisits(visits: Visit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
}

export function generateVisitName(visit: Pick<Visit, 'stops' | 'startDate' | 'endDate'>): string {
  const parts: string[] = [];
  for (const stop of visit.stops) {
    const label = stop.city || stop.state || stop.country || stop.region;
    if (label && !parts.includes(label)) parts.push(label);
  }
  const locationStr = parts.length > 0 ? parts.join(' · ') : 'New Visit';
  if (visit.startDate && visit.endDate) {
    try {
      const s = new Date(visit.startDate);
      const e = new Date(visit.endDate);
      const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${locationStr} (${fmt(s)}–${fmt(e)})`;
    } catch {}
  }
  return locationStr;
}

export function useVisitPlans() {
  const [visits, setVisits] = useState<Visit[]>(() => loadVisits());

  useEffect(() => {
    saveVisits(visits);
  }, [visits]);

  const createVisit = useCallback((partial?: Partial<Visit>): Visit => {
    const now = new Date().toISOString();
    const visit: Visit = {
      id: crypto.randomUUID(),
      name: '',
      dateMode: 'flexible',
      timeBudgetMode: 'all_day',
      stops: [],
      mode: 'money',
      createdAt: now,
      updatedAt: now,
      ...partial,
    };
    setVisits(prev => {
      const next = [visit, ...prev];
      // Save synchronously so navigation doesn't race ahead of the effect
      saveVisits(next);
      return next;
    });
    return visit;
  }, []);

  const updateVisit = useCallback((id: string, updates: Partial<Visit>) => {
    setVisits(prev => {
      const next = prev.map(v =>
        v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
      );
      saveVisits(next);
      return next;
    });
  }, []);

  const deleteVisit = useCallback((id: string) => {
    setVisits(prev => {
      const next = prev.filter(v => v.id !== id);
      saveVisits(next);
      return next;
    });
  }, []);

  const duplicateVisit = useCallback((id: string): Visit | null => {
    const src = loadVisits().find(v => v.id === id);
    if (!src) return null;
    const now = new Date().toISOString();
    const dup: Visit = {
      ...structuredClone(src),
      id: crypto.randomUUID(),
      name: `${src.name} (copy)`,
      generatedAt: undefined,
      itinerary: undefined,
      ticketPlan: undefined,
      routeGeoJson: undefined,
      createdAt: now,
      updatedAt: now,
    };
    setVisits(prev => {
      const next = [dup, ...prev];
      saveVisits(next);
      return next;
    });
    return dup;
  }, []);

  const getVisit = useCallback((id: string): Visit | undefined => {
    // Always read fresh from localStorage to avoid stale closure issues
    return loadVisits().find(v => v.id === id);
  }, []);

  return { visits, createVisit, updateVisit, deleteVisit, duplicateVisit, getVisit };
}
