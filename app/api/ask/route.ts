import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const configured = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://qpbhjn080e.execute-api.us-east-1.amazonaws.com';
    if (!configured || !configured.startsWith('http')) {
      console.error('NEXT_PUBLIC_API_URL is not set to a valid URL');
      return NextResponse.json({ error: 'API base URL not configured' }, { status: 500 });
    }
    // Prepare possible bases (resilient to stage mismatches)
    const bases: string[] = [];
    const noSlash = configured.replace(/\/$/, '');
    const withoutStage = noSlash.replace(/\/(prod|\$default)$/i, '');
    const withProd = withoutStage + '/prod';
    for (const b of [noSlash, withoutStage, withProd]) {
      if (b && !bases.includes(b)) bases.push(b);
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;
    // Try bases in order until one succeeds
    let res: Response | null = null;
    let text = '';
    let lastErr: any = null;
    for (const base of bases) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 20000);
        const r = await fetch(`${base}/ask`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(t);
        const bodyText = await r.text();
        // accept first successful or even 4xx/5xx to pass through real error
        res = r; text = bodyText; break;
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    if (!res) {
      return NextResponse.json({ error: 'Upstream not reachable', detail: String(lastErr), tried: bases }, { status: 502, headers: { 'x-base-tried': bases.join(',') } });
    }
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
      return new NextResponse(JSON.stringify(shaped), { status: res.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'x-base-used': bases.find(b => true) as string } });
    } catch {
      return new NextResponse(text, { status: res.status, headers: { 'Content-Type': ct } });
    }
  } catch (err) {
    console.error('Upstream request failed', err);
    return NextResponse.json({ error: 'Upstream request failed', detail: String(err) }, { status: 502 });
  }
}
