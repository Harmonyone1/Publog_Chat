import { NextResponse } from 'next/server';

const saved = [
  {
    id: 'q1',
    question: 'Top 10 NIINs by revenue in 2022',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'q2',
    question: 'Average unit price for NIIN 000000057',
    createdAt: Date.now() - 86400000 * 15,
  },
];

export async function GET() {
  return NextResponse.json({ saved });
}
