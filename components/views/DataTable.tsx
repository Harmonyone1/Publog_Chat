'use client';
import React, { useMemo, useState } from 'react';
import { Column, Row } from '../../lib/types';
import { formatNumber, looksNumericHeader } from '../../lib/format';

export default function DataTable({ columns, rows, pageSize = 20, locale = 'en-US' }: { columns: Column[]; rows: Row[]; pageSize?: number; locale?: string }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = page * pageSize;
  const end = Math.min(rows.length, start + pageSize);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);
  const numericCols = useMemo(() => columns.map((c) => looksNumericHeader(c.name)), [columns]);

  function goto(p: number) {
    const np = Math.max(0, Math.min(pageCount - 1, p));
    setPage(np);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-400">Results {rows.length ? `(${start + 1}-${end} of ${rows.length})` : ''}</div>
        <div className="flex items-center gap-2 text-xs">
          <button className="px-2 py-1 border border-slate-700 rounded disabled:opacity-50" onClick={() => goto(0)} disabled={page === 0}>
            « First
          </button>
          <button className="px-2 py-1 border border-slate-700 rounded disabled:opacity-50" onClick={() => goto(page - 1)} disabled={page === 0}>
            ‹ Prev
          </button>
          <span className="px-1">
            Page {page + 1} / {pageCount}
          </span>
          <button className="px-2 py-1 border border-slate-700 rounded disabled:opacity-50" onClick={() => goto(page + 1)} disabled={page >= pageCount - 1}>
            Next ›
          </button>
          <button className="px-2 py-1 border border-slate-700 rounded disabled:opacity-50" onClick={() => goto(pageCount - 1)} disabled={page >= pageCount - 1}>
            Last »
          </button>
        </div>
      </div>
      <table className="text-sm min-w-full">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.name} className="text-left px-2 py-1 font-medium">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, i) => (
            <tr key={i} className="border-t border-slate-800">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1">
                  {numericCols[j] ? formatNumber(cell as any, { locale }) : ((cell as any) ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
