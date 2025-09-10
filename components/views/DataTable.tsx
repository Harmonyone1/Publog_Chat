'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ask } from '../../lib/api';
import { AskResponse, Column as ColType, Row as RowType } from '../../lib/types';
import { Column, Row } from '../../lib/types';
import { formatNumber, looksNumericHeader } from '../../lib/format';
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { toCsv } from '../../lib/export';

export default function DataTable({ columns, rows, pageSize = 20, locale = 'en-US' }: { columns: Column[]; rows: Row[]; pageSize?: number; locale?: string }) {
  const numericCols = useMemo(() => columns.map((c) => looksNumericHeader(c.name)), [columns]);
  const data = useMemo(() => rows.map((r) => Object.fromEntries(columns.map((c, i) => [c.name, r[i]]))), [rows, columns]);
  const defs: ColumnDef<any>[] = useMemo(
    () =>
      columns.map((c, idx) => ({
        accessorKey: c.name,
        header: c.name,
        cell: (info) => (numericCols[idx] ? formatNumber(info.getValue(), { locale }) : (info.getValue() ?? '')),
      })),
    [columns, numericCols, locale]
  );

  const [sorting, setSorting] = useState<any>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const table = useReactTable({
    data,
    columns: defs,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // manual pagination using table.getRowModel().rows
  const allRows = table.getRowModel().rows;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(allRows.length / pageSize));
  const start = page * pageSize;
  const end = Math.min(allRows.length, start + pageSize);
  const pageRows = allRows.slice(start, end);

  function goto(p: number) {
    const np = Math.max(0, Math.min(pageCount - 1, p));
    setPage(np);
  }

  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [drillLoading, setDrillLoading] = useState<Record<number, boolean>>({});
  const [drillError, setDrillError] = useState<Record<number, string | null>>({});
  const [drillResult, setDrillResult] = useState<Record<number, AskResponse | null>>({});

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="text-sm text-slate-400">Results {allRows.length ? `(${start + 1}-${end} of ${allRows.length})` : ''}</div>
        <div className="flex items-center gap-2">
          <input
            className="text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1"
            placeholder="Filter..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
          <button
            className="text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800"
            onClick={() => {
              const cols = columns;
              const filteredRows = table.getRowModel().rows.map((r) => r.original);
              const csv = toCsv(cols, filteredRows.map((o: any) => cols.map((c) => o[c.name])));
              navigator.clipboard?.writeText(csv).catch(() => {});
            }}
          >
            Copy CSV
          </button>
          <button
            className="text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800"
            onClick={() => {
              const json = JSON.stringify(table.getRowModel().rows.map((r) => r.original), null, 2);
              navigator.clipboard?.writeText(json).catch(() => {});
            }}
          >
            Copy JSON
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button className="px-2 py-1 border border-slate-700 rounded disabled:opacity-50" onClick={() => goto(0)} disabled={page === 0}>
            « First
          </button>
          <button className="px-2 py-1 border border-slate-700 rounded disabled:opacity-50" onClick={() => goto(page - 1)} disabled={page === 0}>
            ‹ Prev
          </button>
          <span className="px-1">Page {page + 1} / {pageCount}</span>
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
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="text-left px-2 py-1 font-medium select-none cursor-pointer" onClick={h.column.getToggleSortingHandler()}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? null}
                </th>
              ))}
              <th className="px-2 py-1"></th>
            </tr>
          ))}
          <tr>
            {table.getFlatHeaders().map((h) => (
              <th key={h.id} className="px-2 py-1">
                {h.column.getCanFilter() && (
                  <input
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-1 py-1"
                    placeholder={`Filter ${String(h.column.columnDef.header)}`}
                    value={(h.column.getFilterValue() as string) ?? ''}
                    onChange={(e) => h.column.setFilterValue(e.target.value)}
                  />
                )}
              </th>
            ))}
            <th className="px-2 py-1"></th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, i) => (
            <React.Fragment key={row.id}>
              <tr className="border-t border-slate-800">
                {row.getVisibleCells().map((cell) => {
                  const header = String(cell.column.columnDef.header || '');
                  const value = cell.getValue() as any;
                  let href: string | null = null;
                  if (header.toLowerCase() === 'niin' && value) href = '/chat?q=' + encodeURIComponent('Show details for NIIN ' + String(value));
                  if (header.toLowerCase() === 'company_name' && value) href = '/chat?q=' + encodeURIComponent('Show recent awards and items for company ' + String(value));
                  if (header.toLowerCase() === 'part_number' && value) href = '/chat?q=' + encodeURIComponent('Show details for part number ' + String(value));
                  if (header.toLowerCase() === 'contract_number' && value) href = '/chat?q=' + encodeURIComponent('Show line items and supplier for contract ' + String(value));
                  if (header.toLowerCase() === 'fsc' && value) href = '/chat?q=' + encodeURIComponent('Describe FSC ' + String(value) + ' with name and top NIINs');
                  return (
                    <td key={cell.id} className="px-2 py-1">
                      {href ? (
                        <Link href={href} className="text-sky-400 hover:underline">{String(value)}</Link>
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-1 text-right">
                  <button className="text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800" onClick={() => setExpandedRow(expandedRow === i ? null : i)}>
                    {expandedRow === i ? 'Hide' : 'Details'}
                  </button>
                </td>
              </tr>
              {expandedRow === i && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-2 py-2 bg-slate-950/60">
                    <div className="text-xs text-slate-300 mb-2">Row details</div>
                    <pre className="text-xs overflow-x-auto mb-3">{JSON.stringify(row.original, null, 2)}</pre>
                    <div className="text-xs text-slate-300 mb-2">Inline drill-down</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['niin','company_name','part_number','contract_number','fsc'].map((key) => {
                        const val = (row.original as any)[key];
                        if (!val) return null;
                        const questionMap: Record<string, string> = {
                          niin: `Show details for NIIN ${val}`,
                          company_name: `Show recent awards and items for company ${val}`,
                          part_number: `Show details for part number ${val}`,
                          contract_number: `Show line items and supplier for contract ${val}`,
                          fsc: `Describe FSC ${val} with name and top NIINs`,
                        };
                        return (
                          <button
                            key={key}
                            className="text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800"
                            onClick={async () => {
                              setDrillError((e) => ({ ...e, [i]: null }));
                              setDrillLoading((l) => ({ ...l, [i]: true }));
                              setDrillResult((r) => ({ ...r, [i]: null }));
                              try {
                                const q = questionMap[key];
                                const resp = await ask(q);
                                setDrillResult((r) => ({ ...r, [i]: resp }));
                              } catch (e: any) {
                                setDrillError((er) => ({ ...er, [i]: e?.message || 'Failed' }));
                              } finally {
                                setDrillLoading((l) => ({ ...l, [i]: false }));
                              }
                            }}
                          >
                            {key}: {String(val)}
                          </button>
                        );
                      })}
                      <button
                        className="text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800"
                        onClick={() => {
                          setDrillResult((r) => ({ ...r, [i]: null }));
                          setDrillError((e) => ({ ...e, [i]: null }));
                        }}
                      >
                        Clear
                      </button>
                    </div>
                    {drillLoading[i] && (
                      <div className="text-xs text-slate-400">Loading drill-down...</div>
                    )}
                    {drillError[i] && (
                      <div className="text-xs text-red-400">{drillError[i]}</div>
                    )}
                    {drillResult[i] && (drillResult[i] as any).mode === 'sql' && (drillResult[i] as any).result && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-300 mb-1">Drill-down results</div>
                        <DataTable columns={(drillResult[i] as any).result.columns as ColType[]} rows={(drillResult[i] as any).result.rows as RowType[]} pageSize={10} />
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
