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
    const ct = res.headers.get('content-type') || 'application/json; charset=utf-8';
    const plan = cookies().get('selected_plan_v1')?.value || 'free';
    // On upstream error, return payload without gating
    if (!res.ok) {
      try {
        const errObj = JSON.parse(text);
        return NextResponse.json(errObj, { status: res.status });
      } catch {
        return new NextResponse(text, { status: res.status, headers: { 'Content-Type': ct } });
      }
    }
    // Success path
    try {
      let obj: any = JSON.parse(text);
      if (obj && typeof obj === 'object' && 'statusCode' in obj && 'body' in obj) {
        const inner = typeof obj.body === 'string' ? JSON.parse(obj.body) : obj.body;
        obj = inner || obj;
      }
      if (plan === 'free' && obj && typeof obj === 'object') {
        (obj as any)._plan = 'free';
        if (obj.result && Array.isArray(obj.result.rows)) {
          const cap = 100;
          if (obj.result.rows.length > cap) {
            obj.result.rows = obj.result.rows.slice(0, cap);
            (obj as any)._note = `Capped to ${cap} rows on Free plan.`;
          }
        }
        delete obj.sql;
      }
      // Ensure AskResponse shape for the client: if result exists but no mode, mark as SQL mode
      let shaped: any = obj;
      if (!('mode' in obj) && obj && typeof obj === 'object' && obj.result && typeof obj.result === 'object') {
        shaped = { mode: 'sql', result: obj.result, sql: obj.sql };
        if ((obj as any)._plan) (shaped as any)._plan = (obj as any)._plan;
        if ((obj as any)._note) (shaped as any)._note = (obj as any)._note;
      }
      return NextResponse.json(shaped, { status: res.status });
    } catch {
      return new NextResponse(text, { status: res.status, headers: { 'Content-Type': ct } });
    }
  } catch (err) {
    console.error('Upstream request failed', err);
    return NextResponse.json({ error: 'Upstream request failed', detail: String(err) }, { status: 502 });
  }
}
