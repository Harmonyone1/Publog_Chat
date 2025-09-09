'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Plan = 'free' | 'pro' | 'enterprise';
const KEY = 'selected_plan_v1';

const PlanContext = createContext<Plan>('free');

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan>('free');
  useEffect(() => {
    try {
      // Initialize from cookie or localStorage
      const cookieMatch = document.cookie.match(/(?:^|; )selected_plan_v1=([^;]+)/);
      const fromCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) as Plan : undefined;
      const saved = (fromCookie || (localStorage.getItem(KEY) as Plan)) || 'free';
      if (saved) setPlan(saved);
      const onStorage = (e: StorageEvent) => {
        if (e.key === KEY && e.newValue) setPlan(e.newValue as Plan);
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, plan);
      document.cookie = `selected_plan_v1=${encodeURIComponent(plan)}; path=/; SameSite=Lax`;
    } catch {}
  }, [plan]);
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
