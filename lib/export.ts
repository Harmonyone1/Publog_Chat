import { Column, Row } from './types';

export function toCsv(columns: Column[], rows: Row[]): string {
  const header = columns.map((c) => escapeCsv(c.name)).join(',');
  const lines = rows.map((r) => r.map((cell) => escapeCsv(cell as any)).join(','));
  return [header, ...lines].join('\n');
}

function escapeCsv(value: any): string {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

