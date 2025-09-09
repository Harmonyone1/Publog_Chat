import { NextResponse } from 'next/server';

const datasets = [
  {
    id: 'awards',
    name: 'Contract Awards',
    description: 'All federal contract awards with basic details.',
    rows: 125000,
    updated: '2024-01-01',
  },
  {
    id: 'suppliers',
    name: 'Supplier Directory',
    description: 'Registered suppliers with contact information.',
    rows: 32000,
    updated: '2024-02-15',
  },
];

export async function GET() {
  return NextResponse.json({ datasets });
}
