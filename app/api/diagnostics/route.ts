import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '';
  const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || '';
  const result: any = { base, hasApiKey: Boolean(apiKey) };
  if (!base) {
    return NextResponse.json({ ok: false, error: 'API base URL not configured', ...result }, { status: 500 });
  }
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
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
    return NextResponse.json({ ok: res.ok, status: res.status, contentType: res.headers.get('content-type'), body, ...result }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e), ...result }, { status: 502 });
  }
}

