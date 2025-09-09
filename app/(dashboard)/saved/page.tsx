'use client';
import { FormEvent, useState } from 'react';
import useSWR from 'swr';

type SavedItem = {
  id: string;
  question: string;
  createdAt: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SavedPage() {
  const { data, error, mutate } = useSWR<{ saved: SavedItem[] }>(
    '/api/saved',
    fetcher
  );
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error('Request failed');
      setQuestion('');
      await mutate();
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  if (error) return <div>Failed to load saved results.</div>;
  if (!data) return <div>Loading saved results...</div>;

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="grid gap-2 max-w-md">
        <input
          type="text"
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="p-2 rounded bg-slate-800"
          required
        />
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-blue-600 hover:bg-blue-700 rounded p-2"
        >
          {status === 'saving' ? 'Saving…' : 'Save Question'}
        </button>
        {status === 'error' && (
          <p className="text-red-400 text-sm">Failed to save question.</p>
        )}
      </form>
      <ul className="space-y-2">
        {data.saved.map((item) => (
          <li key={item.id} className="border border-slate-800 rounded p-4">
            <p className="font-medium">{item.question}</p>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
