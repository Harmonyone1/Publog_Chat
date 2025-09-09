import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { genId, UID_COOKIE } from '../../../lib/uid';
import { getDdb, TABLE_MESSAGES } from '../../../lib/aws';
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

function getUid(): string {
  const jar = cookies();
  let uid = jar.get(UID_COOKIE)?.value;
  if (!uid) uid = genId();
  return uid;
}

export async function GET(req: NextRequest) {
  const uid = getUid();
  const sessionId = req.nextUrl.searchParams.get('sessionId') || '';
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  const ddb = getDdb();
  let messages: { id: string; role: string; content: string; ts: number }[] = [];
  if (ddb && TABLE_MESSAGES) {
    try {
      const resp = await ddb.send(new QueryCommand({
        TableName: TABLE_MESSAGES,
        KeyConditionExpression: '#u = :u AND begins_with(#id, :p)',
        ExpressionAttributeNames: { '#u': 'uid', '#id': 'id' },
        ExpressionAttributeValues: { ':u': uid, ':p': `${sessionId}#` },
        ScanIndexForward: true,
      }));
      messages = (resp.Items || []).map((it: any) => ({ id: it.id, role: it.role, content: it.content, ts: it.ts }));
    } catch {}
  }
  const res = NextResponse.json({ messages });
  res.cookies.set(UID_COOKIE, uid, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

export async function POST(req: NextRequest) {
  const uid = getUid();
  const ddb = getDdb();
  const body = await req.json().catch(() => ({}));
  const { sessionId, role, content, ts } = body || {};
  if (!sessionId || !role || !content) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
  const when = typeof ts === 'number' ? ts : Date.now();
  const id = `${sessionId}#${when}-${genId()}`;
  if (ddb && TABLE_MESSAGES) {
    try {
      await ddb.send(new PutCommand({ TableName: TABLE_MESSAGES, Item: { uid, id, sessionId, role, content, ts: when } }));
    } catch {}
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(UID_COOKIE, uid, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

