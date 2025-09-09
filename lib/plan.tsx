'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Plan = 'free' | 'pro' | 'enterprise';
const KEY = 'selected_plan_v1';

const PlanContext = createContext<Plan>('free');

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan>('free');
  useEffect(() => {
    try {
      const saved = (localStorage.getItem(KEY) as Plan) || 'free';
      if (saved) setPlan(saved);
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY && e.newValue) setPlan(e.newValue as Plan);
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    } catch {}
  }, []);
  return <PlanContext.Provider value={plan}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  return useContext(PlanContext);
}

export const LIMITS = {
  free: { historySessions: 3, savedItems: 10 },
  pro: { historySessions: 100, savedItems: 1000 },
  enterprise: { historySessions: 1000, savedItems: 10000 },
} as const;

