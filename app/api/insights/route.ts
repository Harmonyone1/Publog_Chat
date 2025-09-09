import { NextResponse } from 'next/server';

type Insight = {
  id: string;
  title: string;
  description: string;
  createdAt: number;
};

let insights: Insight[] = [
  {
    id: 'top-suppliers',
    title: 'Top suppliers by revenue',
    description:
      'Identifies suppliers with the highest revenue in the last fiscal year.',
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

export async function POST(req: Request) {
  try {
    const { title, description } = await req.json();
    if (!title || !description) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const insight: Insight = {
      id: Date.now().toString(),
      title,
      description,
      createdAt: Date.now(),
    };
    insights.push(insight);
    return NextResponse.json({ insight }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
