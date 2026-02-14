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
    setVisits(prev => [visit, ...prev]);
    return visit;
  }, []);

  const updateVisit = useCallback((id: string, updates: Partial<Visit>) => {
    setVisits(prev => prev.map(v =>
      v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
    ));
  }, []);

  const deleteVisit = useCallback((id: string) => {
    setVisits(prev => prev.filter(v => v.id !== id));
  }, []);

  const duplicateVisit = useCallback((id: string): Visit | null => {
    const src = visits.find(v => v.id === id);
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
    setVisits(prev => [dup, ...prev]);
    return dup;
  }, [visits]);

  const getVisit = useCallback((id: string): Visit | undefined => {
    return visits.find(v => v.id === id);
  }, [visits]);

  return { visits, createVisit, updateVisit, deleteVisit, duplicateVisit, getVisit };
}
