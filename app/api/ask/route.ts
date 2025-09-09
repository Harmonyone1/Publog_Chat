import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
    // Attempt to gate features by plan server-side
    const plan = cookies().get('selected_plan_v1')?.value || 'free';
    try {
      const obj = JSON.parse(text);
      if (plan === 'free') {
        // Remove SQL from response for free plan
        if (typeof obj === 'object' && obj) {
          delete obj.sql;
          (obj as any)._plan = 'free';
        }
      }
      return NextResponse.json(obj, { status: res.status });
    } catch {
      // Fallback to raw text if not JSON
      return new NextResponse(text, {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    console.error('Lambda request failed', err);
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 500 });
  }
}
