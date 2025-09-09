import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SavedEntry } from '../../../lib/types';
import { genId, UID_COOKIE } from '../../../lib/uid';
import { getDdb, TABLE_SAVED } from '../../../lib/aws';
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

function getUid(): string {
  const jar = cookies();
  let uid = jar.get(UID_COOKIE)?.value;
  if (!uid) uid = genId();
  return uid;
}

export async function GET() {
  const uid = getUid();
  let saved: SavedEntry[] = [];
  const ddb = getDdb();
  if (ddb && TABLE_SAVED) {
    try {
      const resp = await ddb.send(new QueryCommand({
        TableName: TABLE_SAVED,
        KeyConditionExpression: '#u = :u',
        ExpressionAttributeNames: { '#u': 'uid' },
        ExpressionAttributeValues: { ':u': uid },
        ScanIndexForward: false,
      }));
      saved = (resp.Items || []).map((it: any) => ({ id: it.id, question: it.question, sql: it.sql, createdAt: it.createdAt }));
    } catch {}
  }
  const res = NextResponse.json({ saved });
  res.cookies.set(UID_COOKIE, uid, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

export async function POST(req: NextRequest) {
  const uid = getUid();
  try {
    const body = await req.json();
    const { question, sql } = body || {};
    if (!question) return NextResponse.json({ ok: false, error: 'Missing question' }, { status: 400 });
    const entry: SavedEntry = { id: genId(), question, sql, createdAt: Date.now() };
    const ddb = getDdb();
    if (ddb && TABLE_SAVED) {
      try {
        await ddb.send(new PutCommand({ TableName: TABLE_SAVED, Item: { uid, ...entry } }));
      } catch {}
    }
    const res = NextResponse.json({ ok: true, entry });
    res.cookies.set(UID_COOKIE, uid, { httpOnly: false, sameSite: 'lax', path: '/' });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
