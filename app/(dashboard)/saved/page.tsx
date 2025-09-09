'use client';
import useSWR from 'swr';

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
  return (
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
  );
}
