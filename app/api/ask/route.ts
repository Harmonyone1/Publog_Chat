import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const base = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://qpbhjn080e.execute-api.us-east-1.amazonaws.com';
    if (!base || !base.startsWith('http')) {
      console.error('NEXT_PUBLIC_API_URL is not set to a valid URL');
      return NextResponse.json({ error: 'API base URL not configured' }, { status: 500 });
    }
    const res = await fetch(`${base}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Lambda request failed', err);
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 500 });
  }
}
