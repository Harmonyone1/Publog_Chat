import { AnswerPayload } from './types';

export function normalizeAnswer(data: any): AnswerPayload {
  if (data.views) return data as AnswerPayload;
  const columns: string[] = data.columns ?? [];
  const rows: any[][] = data.rows ?? [];
  const views: any[] = [];

  if (columns.length && rows.length) {
    views.push({ type: 'table', title: 'Results', columns, rows });
    const numericIndex = columns.findIndex((c) => /amount|revenue|total|sum/i.test(c));
    if (numericIndex >= 0) {
      const dim = columns[0];
      const measure = columns[numericIndex];
      const chartData = rows.map((r) => ({ [dim]: r[0], [measure]: Number(r[numericIndex]) }));
      const total = chartData.reduce((acc, r) => acc + (r[measure] || 0), 0);
      views.unshift({ type: 'bar', title: `${measure} by ${dim}`, data: chartData, encoding: { x: dim, y: measure } });
      views.unshift({ type: 'kpi', title: `Total ${measure}`, value: total });
    }
  }

  return {
    answer: data.answer || '',
    explanation: data.explanation,
    views,
    raw: { columns, rows },
    meta: data.meta,
  };
}
