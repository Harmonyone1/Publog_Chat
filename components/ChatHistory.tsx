'use client';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { usePlan, LIMITS } from '../lib/plan';

type Session = { id: string; title: string; createdAt: number };

export default function ChatHistory({ currentId, onSelect, onNew }: { currentId: string | null; onSelect: (id: string) => void; onNew: () => void }) {
  const plan = usePlan();
  const [sessions, setSessions] = useState<Session[]>([]);
  const limit = LIMITS[plan].historySessions;
  const canAdd = sessions.length < limit;

  async function refresh() {
    try {
      const res = await fetch('/api/history', { cache: 'no-store' });
      const json = await res.json();
      setSessions((json.sessions as Session[]) || []);
    } catch {
      setSessions([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addSession() {
    if (!canAdd) {
      alert(`History limit reached for your plan (${limit}). Upgrade on the Plans page.`);
      return;
    }
    try {
      const res = await fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New chat' }) });
      if (!res.ok) throw new Error('Failed');
      await refresh();
    } catch {
      // ignore
    }
    onNew();
  }

  return (
    <div className="w-56 border-r border-slate-800 p-3 hidden md:block">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-400">History</div>
        <button className="text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800" onClick={addSession} disabled={!canAdd}>
          {canAdd ? 'New Chat' : 'Limit'}
        </button>
      </div>
      <ul className="space-y-1">
        {sessions.map((s) => (
          <li key={s.id}>
            <button
              className={clsx('w-full text-left px-2 py-1 rounded text-sm', currentId === s.id ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}
              onClick={() => onSelect(s.id)}
              title={new Date(s.createdAt).toLocaleString()}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 text-[11px] text-slate-500">Plan: {plan} • Limit {limit} sessions</div>
    </div>
  );
}
