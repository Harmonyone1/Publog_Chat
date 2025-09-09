'use client';
import useSWR from 'swr';

type Insight = {
  id: string;
  title: string;
  description: string;
  createdAt: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function InsightsPage() {
  const { data, error } = useSWR<{ insights: Insight[] }>(
    '/api/insights',
    fetcher
  );
  if (error) return <div>Failed to load insights.</div>;
  if (!data) return <div>Loading insights...</div>;
  return (
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
  );
}
