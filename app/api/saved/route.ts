import { NextResponse } from 'next/server';

type SavedItem = {
  id: string;
  question: string;
  createdAt: number;
};

let saved: SavedItem[] = [
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

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const item: SavedItem = {
      id: Date.now().toString(),
      question,
      createdAt: Date.now(),
    };
    saved.push(item);
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
