import { NextResponse } from 'next/server';

type Dataset = {
  id: string;
  name: string;
  description: string;
  rows: number;
  updated: string;
};

let datasets: Dataset[] = [
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

export async function POST(req: Request) {
  try {
    const { name, description, rows, updated } = await req.json();
    if (!name || !description || rows == null || !updated) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const dataset: Dataset = {
      id: Date.now().toString(),
      name,
      description,
      rows: Number(rows),
      updated,
    };
    datasets.push(dataset);
    return NextResponse.json({ dataset }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
