import { NextResponse } from 'next/server';
import { fetchNiinMap } from '../../../lib/athena';
import { cookies } from 'next/headers';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const configured = process.env.NEXT_PUBLIC_API_URL;
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
    // Try bases in order; accept the first 2xx response, otherwise fall back to the last non-2xx/error
    let res: Response | null = null;
    let text = '';
    let lastErr: any = null;
    let lastNonOk: { res: Response; text: string } | null = null;
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
        if (r.ok) { res = r; text = bodyText; break; }
        lastNonOk = { res: r, text: bodyText };
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    if (!res) {
      if (lastNonOk) {
        const ctErr = lastNonOk.res.headers.get('content-type') || 'application/json; charset=utf-8';
        return new NextResponse(lastNonOk.text, { status: lastNonOk.res.status, headers: { 'Content-Type': ctErr, 'x-base-tried': bases.join(',') } });
      }
      return NextResponse.json({ error: 'Upstream not reachable', detail: String(lastErr), tried: bases }, { status: 502, headers: { 'x-base-tried': bases.join(',') } });
    }
    const ct = res.headers.get('content-type') || 'application/json; charset=utf-8';
    const plan = cookies().get('selected_plan_v1')?.value || 'free';
    // On upstream error, attempt Lambda-direct fallback (if configured)
    if (!res.ok) {
      const lambdaArn = process.env.LAMBDA_ARN;
      if (lambdaArn) {
        try {
          const lc = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
          const event = { body: JSON.stringify({ question: (payload && payload.question) || '' }) };
          const out = await lc.send(new InvokeCommand({ FunctionName: lambdaArn, Payload: Buffer.from(JSON.stringify(event)) }));
          const raw = out.Payload ? Buffer.from(out.Payload as Uint8Array).toString('utf-8') : '';
          let obj: any = raw;
          try { obj = JSON.parse(raw); } catch {}
          // Unwrap API Gateway envelope
          if (obj && typeof obj === 'object' && 'statusCode' in obj && 'body' in obj) {
            const inner = typeof obj.body === 'string' ? JSON.parse(obj.body) : obj.body;
            const statusCode = obj.statusCode || 200;
            if (statusCode >= 200 && statusCode < 300) {
              let shaped: any = inner;
              const plan = cookies().get('selected_plan_v1')?.value || 'free';
              if (plan === 'free' && shaped && typeof shaped === 'object') {
                (shaped as any)._plan = 'free';
                if (shaped.result && Array.isArray(shaped.result.rows)) {
                  const cap = 100;
                  if (shaped.result.rows.length > cap) {
                    shaped.result.rows = shaped.result.rows.slice(0, cap);
                    (shaped as any)._note = `Capped to ${cap} rows on Free plan.`;
                  }
                }
                delete shaped.sql;
              }
              if (!('mode' in shaped) && shaped && shaped.result) {
                shaped = { mode: 'sql', result: shaped.result, sql: shaped.sql };
              }
              return new NextResponse(JSON.stringify(shaped), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
            }
            // propagate fallback error body
            return new NextResponse(typeof inner === 'string' ? inner : JSON.stringify(inner), { status: statusCode, headers: { 'Content-Type': 'application/json' } });
          }
          // If no envelope, return as-is
          return new NextResponse(raw || text, { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (e) {
          // fall through to original error
        }
      }
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
      // Normalize result columns to Column[] { name }
      const normalizeColumns = (res: any) => {
        if (!res || !res.columns) return res;
        const cols = res.columns;
        let mapped: any[] = [];
        if (Array.isArray(cols)) {
          mapped = cols.map((c: any) => {
            if (typeof c === 'string') return { name: c };
            if (c && typeof c === 'object' && 'Name' in c && !('name' in c)) return { name: (c as any).Name };
            return { name: c?.name ?? String(c ?? '') };
          }).map((c: any) => {
            const nm = String(c.name || '').trim();
            // Canonicalize known variants for display
            if (/^fsc_name$/i.test(nm)) return { name: 'FSC_TITLE' };
            if (/^fsg_name$/i.test(nm)) return { name: 'FSG_TITLE' };
            if (/^itemname$/i.test(nm)) return { name: 'item_name' };
            if (/^item name$/i.test(nm)) return { name: 'item_name' };
            return { name: nm };
          });
        }
        return { ...res, columns: mapped };
      };
      if (obj && typeof obj === 'object' && obj.result) {
        obj.result = normalizeColumns(obj.result);
        try {
          // Enrich NIIN-level results with item_name and FSC_TITLE when missing
          const res: any = obj.result;
          const colNames: string[] = (res.columns || []).map((c: any) => String(c.name || '').trim());
          const idxNiin = colNames.findIndex((n) => /^niin$/i.test(n));
          if (idxNiin >= 0) {
            let idxItem = colNames.findIndex((n) => /^item_name$/i.test(n));
            let idxFsc = colNames.findIndex((n) => /^fsc_title$/i.test(n));
            // Add columns if missing
            if (idxItem < 0) { res.columns.push({ name: 'item_name' }); idxItem = res.columns.length - 1; }
            if (idxFsc < 0) { res.columns.push({ name: 'FSC_TITLE' }); idxFsc = res.columns.length - 1; }
            const niins: string[] = (res.rows || []).map((r: any[]) => (r[idxNiin] ?? '') as string);
            const map = await fetchNiinMap(niins);
            res.rows = (res.rows || []).map((r: any[]) => {
              const n = (r[idxNiin] ?? '') as string;
              const m = map[n];
              const out = [...r];
              if (m) {
                if (out[idxItem] == null || String(out[idxItem]).trim() === '') out[idxItem] = m.item_name ?? out[idxItem];
                if (out[idxFsc] == null || String(out[idxFsc]).trim() === '') out[idxFsc] = m.fsc_title ?? out[idxFsc];
              }
              return out;
            });
            obj.result = res;
          }
        } catch {
          // best-effort enrichment; ignore failures
        }
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
      return new NextResponse(JSON.stringify(shaped), { status: res.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    } catch {
      return new NextResponse(text, { status: res.status, headers: { 'Content-Type': ct } });
    }
  } catch (err) {
    console.error('Upstream request failed', err);
    return NextResponse.json({ error: 'Upstream request failed', detail: String(err) }, { status: 502 });
  }
}
