import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const base = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://qpbhjn080e.execute-api.us-east-1.amazonaws.com';
    if (!base || !base.startsWith('http')) {
      console.error('NEXT_PUBLIC_API_URL is not set to a valid URL');
      return NextResponse.json({ error: 'API base URL not configured' }, { status: 500 });
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;
    const res = await fetch(`${base}/ask`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    // Attempt to gate features by plan server-side
    const plan = cookies().get('selected_plan_v1')?.value || 'free';
    try {
      let obj: any = JSON.parse(text);
      // Unwrap API Gateway style { statusCode, body }
      if (obj && typeof obj === 'object' && 'statusCode' in obj && 'body' in obj) {
        const inner = typeof obj.body === 'string' ? JSON.parse(obj.body) : obj.body;
        obj = inner || obj;
      }
      if (plan === 'free') {
        if (typeof obj === 'object' && obj) {
          // Mark plan and cap rows to 100
          (obj as any)._plan = 'free';
          if (obj.result && Array.isArray(obj.result.rows)) {
            const cap = 100;
            if (obj.result.rows.length > cap) {
              obj.result.rows = obj.result.rows.slice(0, cap);
              (obj as any)._note = `Capped to ${cap} rows on Free plan.`;
            }
          }
          // Remove raw SQL for Free
          delete obj.sql;
        }
      }
      return NextResponse.json(obj, { status: res.status });
    } catch {
      // Fallback: pass through upstream error body
      const ct = res.headers.get('content-type') || 'text/plain; charset=utf-8';
      return new NextResponse(text, { status: res.status, headers: { 'Content-Type': ct } });
    }
  } catch (err) {
    console.error('Upstream request failed', err);
    return NextResponse.json({ error: 'Upstream request failed', detail: String(err) }, { status: 502 });
  }
}
