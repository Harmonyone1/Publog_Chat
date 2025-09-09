'use client';
import { FormEvent, useState } from 'react';
import useSWR from 'swr';

type Insight = {
  id: string;
  title: string;
  description: string;
  createdAt: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function InsightsPage() {
  const { data, error, mutate } = useSWR<{ insights: Insight[] }>(
    '/api/insights',
    fetcher
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error('Request failed');
      setTitle('');
      setDescription('');
      await mutate();
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  if (error) return <div>Failed to load insights.</div>;
  if (!data) return <div>Loading insights...</div>;

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="grid gap-2 max-w-md">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 rounded bg-slate-800"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-2 rounded bg-slate-800 h-24"
          required
        />
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-blue-600 hover:bg-blue-700 rounded p-2"
        >
          {status === 'saving' ? 'Saving…' : 'Add Insight'}
        </button>
        {status === 'error' && (
          <p className="text-red-400 text-sm">Failed to add insight.</p>
        )}
      </form>
      <div className="grid gap-4">
        {data.insights.map((i) => (
          <div key={i.id} className="border border-slate-800 rounded p-4">
            <h2 className="font-semibold">{i.title}</h2>
            <p className="text-sm text-slate-400">{i.description}</p>
            <p className="text-xs text-slate-500 mt-2">
              {new Date(i.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
