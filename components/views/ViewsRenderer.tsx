import React, { useEffect, useMemo, useState } from 'react';
import { AskResponse, Column, Row } from '../../lib/types';
import KpiCard from './KpiCard';
import BarChartView from './BarChartView';
import LineChartView from './LineChartView';
import DataTable from './DataTable';
import { toCsv } from '../../lib/export';
import { usePlan, LIMITS } from '../../lib/plan';
import { useRef } from 'react';
import { Canvg } from 'canvg';

function deriveViews(columns: Column[], rows: Row[]) {
  if (!columns.length || !rows.length) return {};
  let numericIndex = columns.findIndex((c) => /amount|revenue|total|sum|count|price|spend|quantity/i.test(c.name));
  if (numericIndex < 0 && columns.length > 1) numericIndex = 1;
  if (numericIndex < 0) return {};

  const dim = columns[0].name;
  const measure = columns[numericIndex].name;
  const chartData = rows.map((r) => ({ [dim]: r[0], [measure]: Number(r[numericIndex]) }));
  const total = chartData.reduce((acc, r) => acc + (r[measure] || 0), 0);
  return {
    kpi: { title: `Total ${measure}`, value: total },
    bar: { title: `${measure} by ${dim}`, data: chartData, encoding: { x: dim, y: measure } },
  };
}

export default function ViewsRenderer({ data, question }: { data: AskResponse | null; question?: string }) {
  // Declare hooks unconditionally to satisfy rules-of-hooks
  const [showSql, setShowSql] = useState(false);
  const plan = usePlan();
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [tablePageSize, setTablePageSize] = useState<number>(20);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [explain, setExplain] = useState<string | null>(null);
  const result = data && data.mode === 'sql' ? data.result : undefined;
  const columns = useMemo(() => (result?.columns ?? []), [result]);
  const rows = useMemo(() => (result?.rows ?? []), [result]);
  const csv = useMemo(() => toCsv(columns, rows), [columns, rows]);
  const views = deriveViews(columns, rows);
  const isReady = !!(data && data.mode === 'sql' && data.result);
  const isFree = (data as any)?._plan === 'free';

  useEffect(() => {
    // Load default chart + page size from server prefs
    fetch('/api/prefs').then((r) => r.json()).then((j) => {
      const p = j.prefs || {};
      if (p.defaultChart) setChartType(p.defaultChart);
      if (typeof p.pageSize === 'number') setTablePageSize(p.pageSize);
    }).catch(() => {});
  }, []);
  async function handleSave() {
    try {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sql: (data as any)?.sql }),
      });
    } catch {
      // ignore
    }
  }
  if (!isReady) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2 my-4">
      <div className="md:col-span-2 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {question ? `Question: ${question}` : null}
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-xs text-slate-400">Chart:</label>
          <select
            className="text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1"
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
          </select>
          {data.sql && (
            <button
              className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
              onClick={() => setShowSql((v) => !v)}
            >
              {showSql ? 'Hide SQL' : 'Show SQL'}
            </button>
          )}
          {data.sql && (
            <button
              className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
              onClick={() => {
                navigator.clipboard?.writeText(data.sql || '').catch(() => {});
              }}
            >
              Copy SQL
            </button>
          )}
          {/* Export SVG */}
          <button
            className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
            onClick={() => {
              const svg = chartRef.current?.querySelector('svg');
              if (!svg) return;
              const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'chart.svg';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download SVG
          </button>
          {/* Export PNG */}
          <button
            className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
            onClick={async () => {
              const svg = chartRef.current?.querySelector('svg');
              if (!svg) return;
              const svgText = new XMLSerializer().serializeToString(svg);
              const canvas = document.createElement('canvas');
              canvas.width = 1200; canvas.height = 600;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              const v = Canvg.fromString(ctx, svgText);
              await v.render();
              canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'chart.png';
                a.click();
                URL.revokeObjectURL(url);
              });
            }}
          >
            Download PNG
          </button>
          {!isFree && (
          <button
            className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
            onClick={() => {
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'results.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download CSV
          </button>
          )}
          <button
            className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
            onClick={() => {
              const dim = columns[0]?.name || 'dimension';
              const count = rows.length;
              let summary = '';
              try {
                const idx = columns.findIndex((c) => /amount|revenue|total|sum|count|price|spend|quantity/i.test(c.name));
                const mIdx = idx >= 0 ? idx : 1;
                const sorted = [...rows].sort((a: any, b: any) => (Number(b[mIdx])||0) - (Number(a[mIdx])||0));
                const topItems = sorted.slice(0, 3).map((r: any) => `${r[0]} (${r[mIdx]})`).join(', ');
                summary = `Top entries: ${topItems}`;
              } catch {}
              setExplain(`Returned ${count} rows grouped by ${dim}. ${summary}`);
            }}
          >
            Explain
          </button>
          <button
            className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
      {explain && (
        <div className="md:col-span-2 text-xs text-slate-300">{explain}</div>
      )}
      {showSql && data.sql && (
        <div className="md:col-span-2">
          <pre className="bg-slate-900 border border-slate-800 rounded p-3 text-xs overflow-x-auto">
            {data.sql}
          </pre>
        </div>
      )}
      {views.kpi && <KpiCard title={views.kpi.title} value={views.kpi.value} />}
      <div ref={chartRef} className="contents">
        {views.bar && chartType === 'bar' && (
          <BarChartView title={views.bar.title} data={views.bar.data} xKey={views.bar.encoding.x} yKey={views.bar.encoding.y} />
        )}
        {views.bar && chartType === 'line' && (
          <LineChartView title={views.bar.title} data={views.bar.data} xKey={views.bar.encoding.x} yKey={views.bar.encoding.y} />
        )}
      </div>
      <div className="md:col-span-2">
        <DataTable columns={columns} rows={rows} pageSize={tablePageSize} />
      </div>
    </div>
  );
}
