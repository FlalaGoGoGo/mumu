import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type StepStatus = 'pending' | 'seen' | 'skipped' | 'saved';

interface VisitProgressState {
  stepStatuses: Record<string, StepStatus>;
  seenCount: number;
  skippedCount: number;
  savedCount: number;
  remainingCount: number;
  totalSteps: number;
  markSeen: (stepId: string) => void;
  markSkipped: (stepId: string) => void;
  markSaved: (stepId: string) => void;
  resetStep: (stepId: string) => void;
  initializeRoute: (stepIds: string[]) => void;
  isTimeConstrained: boolean;
  setTimeConstrained: (v: boolean) => void;
}

const VisitProgressContext = createContext<VisitProgressState | null>(null);

export function VisitProgressProvider({ children }: { children: ReactNode }) {
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
  const [allStepIds, setAllStepIds] = useState<string[]>([]);
  const [isTimeConstrained, setTimeConstrained] = useState(false);

  const initializeRoute = useCallback((stepIds: string[]) => {
    setAllStepIds(stepIds);
    const init: Record<string, StepStatus> = {};
    stepIds.forEach(id => { init[id] = 'pending'; });
    setStepStatuses(init);
    setTimeConstrained(false);
  }, []);

  const updateStatus = useCallback((stepId: string, status: StepStatus) => {
    setStepStatuses(prev => ({ ...prev, [stepId]: status }));
  }, []);

  const seenCount = Object.values(stepStatuses).filter(s => s === 'seen').length;
  const skippedCount = Object.values(stepStatuses).filter(s => s === 'skipped').length;
  const savedCount = Object.values(stepStatuses).filter(s => s === 'saved').length;
  const remainingCount = Object.values(stepStatuses).filter(s => s === 'pending').length;

  return (
    <VisitProgressContext.Provider value={{
      stepStatuses,
      seenCount,
      skippedCount,
      savedCount,
      remainingCount,
      totalSteps: allStepIds.length,
      markSeen: (id) => updateStatus(id, 'seen'),
      markSkipped: (id) => updateStatus(id, 'skipped'),
      markSaved: (id) => updateStatus(id, 'saved'),
      resetStep: (id) => updateStatus(id, 'pending'),
      initializeRoute,
      isTimeConstrained,
      setTimeConstrained,
    }}>
      {children}
    </VisitProgressContext.Provider>
  );
}

export function useVisitProgress() {
  const ctx = useContext(VisitProgressContext);
  if (!ctx) throw new Error('useVisitProgress must be used within VisitProgressProvider');
  return ctx;
}
