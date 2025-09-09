import { NextResponse } from 'next/server';

const insights = [
  {
    id: 'top-suppliers',
    title: 'Top suppliers by revenue',
    description: 'Identifies suppliers with the highest revenue in the last fiscal year.',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'spend-trend',
    title: 'Quarterly spend trend',
    description: 'Visualizes spending trends over the past 4 quarters.',
    createdAt: Date.now() - 86400000 * 7,
  },
];

export async function GET() {
  return NextResponse.json({ insights });
}
