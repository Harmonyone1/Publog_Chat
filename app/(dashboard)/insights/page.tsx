'use client';
import { useState } from 'react';
import { ask } from '../../../lib/api';
import ViewsRenderer from '../../../components/views/ViewsRenderer';

const ideas = [
  { q: 'Top 10 NIINs by revenue in 2022', desc: 'Largest revenue items last FY' },
  { q: 'Quarterly spend trend for FSC 1680 since 2021', desc: 'Trend line over time' },
  { q: 'Average unit price for NIIN 000000057 by year', desc: 'Price changes' },
  { q: 'Top 10 suppliers by total revenue in 2023', desc: 'Supplier ranking' },
  { q: 'Contracts count by month in 2024', desc: 'Seasonality' },
];

export default function InsightsPage() {
  const [busyQ, setBusyQ] = useState<string | null>(null);
  const [dataQ, setDataQ] = useState<Record<string, any>>({});
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ideas.map((i) => (
        <div key={i.q} className="border border-slate-800 rounded p-4 bg-slate-900 animate-fade-in">
          <h2 className="font-semibold">{i.q}</h2>
          <p className="text-sm text-slate-400">{i.desc}</p>
          <div className="mt-3 flex gap-2">
            <a href={`/chat?q=${encodeURIComponent(i.q)}`} className="text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800">Run</a>
            <button
              className="text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800"
              onClick={async () => {
                setBusyQ(i.q);
                try {
                  const resp = await ask(i.q);
                  setDataQ((d) => ({ ...d, [i.q]: resp }));
                } catch (e) {
                  setDataQ((d) => ({ ...d, [i.q]: { error: String(e) } }));
                } finally {
                  setBusyQ(null);
                }
              }}
            >
              Run inline
            </button>
          </div>
          {busyQ === i.q && <div className="text-xs text-slate-400 mt-2">Running...</div>}
          {dataQ[i.q] && !(dataQ[i.q] as any).error && (
            <div className="mt-3">
              <ViewsRenderer data={dataQ[i.q]} question={i.q} />
            </div>
          )}
          {dataQ[i.q] && (dataQ[i.q] as any).error && (
            <div className="text-xs text-red-400 mt-2">{String((dataQ[i.q] as any).error)}</div>
          )}
        </div>
      ))}
    </div>
  );
}
