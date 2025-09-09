import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SavedEntry } from '../../../lib/types';

const COOKIE = 'savedItems';

function readSaved(): SavedEntry[] {
  const jar = cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as SavedEntry[]) : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const saved = readSaved();
  return NextResponse.json({ saved });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, sql } = body || {};
    if (!question) return NextResponse.json({ ok: false, error: 'Missing question' }, { status: 400 });
    const entry: SavedEntry = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      question,
      sql,
      createdAt: Date.now(),
    };
    const list = [...readSaved(), entry];
    const res = NextResponse.json({ ok: true, entry, saved: list });
    res.cookies.set(COOKIE, JSON.stringify(list), { httpOnly: false, sameSite: 'lax', path: '/' });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
