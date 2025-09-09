'use client';
import { FormEvent, useState } from 'react';
import useSWR from 'swr';

type Dataset = {
  id: string;
  name: string;
  description: string;
  rows: number;
  updated: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DatasetsPage() {
  const { data, error, mutate } = useSWR<{ datasets: Dataset[] }>(
    '/api/datasets',
    fetcher
  );
  const [form, setForm] = useState({
    name: '',
    description: '',
    rows: '',
    updated: '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rows: Number(form.rows),
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      setForm({ name: '', description: '', rows: '', updated: '' });
      await mutate();
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  if (error) return <div>Failed to load datasets.</div>;
  if (!data) return <div>Loading datasets...</div>;

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="grid gap-2 max-w-md">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="p-2 rounded bg-slate-800"
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="p-2 rounded bg-slate-800"
          required
        />
        <input
          type="number"
          placeholder="Rows"
          value={form.rows}
          onChange={(e) => setForm({ ...form, rows: e.target.value })}
          className="p-2 rounded bg-slate-800"
          required
        />
        <input
          type="date"
          placeholder="Updated"
          value={form.updated}
          onChange={(e) => setForm({ ...form, updated: e.target.value })}
          className="p-2 rounded bg-slate-800"
          required
        />
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-blue-600 hover:bg-blue-700 rounded p-2"
        >
          {status === 'saving' ? 'Saving…' : 'Add Dataset'}
        </button>
        {status === 'error' && (
          <p className="text-red-400 text-sm">Failed to add dataset.</p>
        )}
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {data.datasets.map((d) => (
          <div key={d.id} className="border border-slate-800 rounded p-4">
            <h2 className="font-semibold">{d.name}</h2>
            <p className="text-sm text-slate-400">{d.description}</p>
            <p className="text-xs text-slate-500 mt-2">
              Rows: {d.rows.toLocaleString()} • Updated {d.updated}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
