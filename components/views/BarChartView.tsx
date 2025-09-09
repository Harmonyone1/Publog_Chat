'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export type BarDatum = Record<string, any>;

export default function BarChartView({ title, data, xKey, yKey }: { title: string; data: BarDatum[]; xKey: string; yKey: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4">
      <div className="text-sm text-slate-400 mb-2">{title}</div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <XAxis dataKey={xKey} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Bar dataKey={yKey} fill="#0ea5e9" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
