'use client';
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
  const { data, error } = useSWR<{ datasets: Dataset[] }>(
    '/api/datasets',
    fetcher
  );
  if (error) return <div>Failed to load datasets.</div>;
  if (!data) return <div>Loading datasets...</div>;
  return (
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
  );
}
