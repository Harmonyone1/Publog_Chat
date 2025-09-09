'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export type LineDatum = Record<string, any>;

export default function LineChartView({ title, data, xKey, yKey }: { title: string; data: LineDatum[]; xKey: string; yKey: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4">
      <div className="text-sm text-slate-400 mb-2">{title}</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey={xKey} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Line type="monotone" dataKey={yKey} stroke="#22d3ee" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

