import React from 'react';

export default function KpiCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
