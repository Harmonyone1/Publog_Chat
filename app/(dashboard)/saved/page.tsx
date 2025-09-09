'use client';
import useSWR from 'swr';
import { useMemo, useState } from 'react';

type SavedItem = {
  id: string;
  question: string;
  createdAt: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SavedPage() {
  const { data, error } = useSWR<{ saved: SavedItem[] }>(
    '/api/saved',
    fetcher
  );
  if (error) return <div>Failed to load saved results.</div>;
  if (!data) return <div>Loading saved results...</div>;
  const [q, setQ] = useState('');
  const filtered = useMemo(() => (data.saved || []).filter((s) => s.question.toLowerCase().includes(q.toLowerCase())), [data.saved, q]);
  return (
    <div>
      <div className="mb-3">
        <input
          className="w-full max-w-md bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm"
          placeholder="Search saved questions..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <ul className="space-y-2">
      {filtered.map((item) => (
        <li key={item.id} className="border border-slate-800 rounded p-4">
          <p className="font-medium">{item.question}</p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(item.createdAt).toLocaleString()}
          </p>
          {item.sql && (
            <details className="mt-2">
              <summary className="text-xs text-slate-400 cursor-pointer">Show SQL</summary>
              <pre className="bg-slate-900 border border-slate-800 rounded p-3 text-xs overflow-x-auto mt-2">{item.sql}</pre>
            </details>
          )}
        </li>
      ))}
      </ul>
    </div>
  );
}
