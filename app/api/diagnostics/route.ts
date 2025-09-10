import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '';
  const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
  const noSlash = configured.replace(/\/$/, '');
  const withoutStage = noSlash.replace(/\/(prod|\$default)$/i, '');
  const withProd = withoutStage + '/prod';
  const bases = [noSlash, withoutStage, withProd].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  const result: any = { configured, bases, hasApiKey: Boolean(apiKey) };
  if (!configured) {
    return NextResponse.json({ ok: false, error: 'API base URL not configured', ...result }, { status: 500 });
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  let lastErr: any = null;
  let lastNonOk: { status: number; body: any; base: string } | null = null;
  for (const base of bases) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(`${base}/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: 'Top 1 NIINs by revenue in 2022' }),
        signal: controller.signal,
      });
      clearTimeout(t);
      const text = await res.text();
      let body: any = text;
      try { body = JSON.parse(text); } catch {}
      if (res.ok) {
        return NextResponse.json({ ok: true, status: res.status, contentType: res.headers.get('content-type'), body, baseUsed: base, ...result }, { status: 200 });
      }
      lastNonOk = { status: res.status, body, base };
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  if (lastNonOk) {
    return NextResponse.json({ ok: false, status: lastNonOk.status, body: lastNonOk.body, baseUsed: lastNonOk.base, ...result }, { status: 200 });
  }
  return NextResponse.json({ ok: false, error: String(lastErr), ...result }, { status: 200 });
}
