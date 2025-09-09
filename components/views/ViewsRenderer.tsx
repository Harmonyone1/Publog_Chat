import React from 'react';
import { AskResponse, Column, Row } from '../../lib/types';
import KpiCard from './KpiCard';
import BarChartView from './BarChartView';
import DataTable from './DataTable';

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

export default function ViewsRenderer({ data }: { data: AskResponse | null }) {
  if (!data || data.mode !== 'sql' || !data.result) return null;
  const { columns, rows } = data.result;
  const views = deriveViews(columns, rows);
  return (
    <div className="grid gap-4 md:grid-cols-2 my-4">
      {views.kpi && <KpiCard title={views.kpi.title} value={views.kpi.value} />}
      {views.bar && (
        <BarChartView title={views.bar.title} data={views.bar.data} xKey={views.bar.encoding.x} yKey={views.bar.encoding.y} />
      )}
      <div className="md:col-span-2">
        <DataTable columns={columns} rows={rows} />
      </div>
    </div>
  );
}
