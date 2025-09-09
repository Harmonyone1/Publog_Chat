'use client';
import { useEffect, useState } from 'react';

type Tier = {
  id: string;
  name: string;
  price: string;
  features: string[];
};

const TIERS: Tier[] = [
  { id: 'free', name: 'Free', price: '$0', features: ['Basic chat', 'CSV export', 'Local saved items'] },
  { id: 'pro', name: 'Pro', price: '$39/mo', features: ['Priority compute', 'Unlimited history', 'Team spaces'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Contact us', features: ['SAML SSO', 'Audit logs', 'Dedicated support'] },
];

const KEY = 'selected_plan_v1';

export default function PlansPage() {
  const [plan, setPlan] = useState<string>('free');
  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) setPlan(saved);
  }, []);
  function choose(id: string) {
    setPlan(id);
    try { localStorage.setItem(KEY, id); } catch {}
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {TIERS.map((t) => (
        <div key={t.id} className={`border rounded p-4 ${plan === t.id ? 'border-blue-500' : 'border-slate-800'} bg-slate-900 animate-fade-in`}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{t.name}</h2>
            <div className="text-slate-300">{t.price}</div>
          </div>
          <ul className="mt-2 text-sm text-slate-400 list-disc pl-5">
            {t.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <button className="mt-3 px-3 py-2 rounded border border-slate-700 hover:bg-slate-800 text-sm" onClick={() => choose(t.id)}>
            {plan === t.id ? 'Selected' : 'Choose'}
          </button>
        </div>
      ))}
    </div>
  );
}

