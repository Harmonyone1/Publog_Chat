import { NextRequest, NextResponse } from 'next/server';
import { getDdb, TABLE_PREFS } from '../../../lib/aws';
import { getCurrentUid, UID_COOKIE, genId } from '../../../lib/uid';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

type Prefs = {
  locale?: string;
  currency?: string;
  theme?: 'light' | 'dark';
  defaultChart?: 'bar' | 'line';
  pageSize?: number;
};

export async function GET() {
  const uid = getCurrentUid();
  const ddb = getDdb();
  let prefs: Prefs = {};
  if (ddb && TABLE_PREFS) {
    try {
      const resp = await ddb.send(new GetCommand({ TableName: TABLE_PREFS, Key: { uid } }));
      prefs = (resp.Item?.prefs as Prefs) || {};
    } catch {}
  }
  const res = NextResponse.json({ prefs });
  res.cookies.set(UID_COOKIE, uid || genId(), { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

export async function PUT(req: NextRequest) {
  const uid = getCurrentUid();
  const body = await req.json().catch(() => ({}));
  const prefs = (body?.prefs || {}) as Prefs;
  const ddb = getDdb();
  if (ddb && TABLE_PREFS) {
    try {
      await ddb.send(new PutCommand({ TableName: TABLE_PREFS, Item: { uid, prefs } }));
    } catch {}
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(UID_COOKIE, uid || genId(), { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

