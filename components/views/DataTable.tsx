import React from 'react';
import { Column, Row } from '../../lib/types';

export default function DataTable({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 overflow-x-auto">
      <div className="text-sm text-slate-400 mb-2">Results</div>
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
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-800">
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-1">
                  {cell as any}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
