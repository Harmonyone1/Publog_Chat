import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { genId, UID_COOKIE, getCurrentUid } from '../../../lib/uid';
import { getDdb, TABLE_HISTORY } from '../../../lib/aws';
import { QueryCommand, PutCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

type Session = { id: string; title: string; createdAt: number };

function getUid(): string { return getCurrentUid(); }

export async function GET() {
  const uid = getUid();
  const ddb = getDdb();
  let sessions: Session[] = [];
  if (ddb && TABLE_HISTORY) {
    try {
      const resp = await ddb.send(new QueryCommand({
        TableName: TABLE_HISTORY,
        KeyConditions: undefined as any,
        KeyConditionExpression: '#u = :u',
        ExpressionAttributeNames: { '#u': 'uid' },
        ExpressionAttributeValues: { ':u': uid },
        ScanIndexForward: false,
      }));
      sessions = (resp.Items || []).map((it: any) => ({ id: it.id, title: it.title, createdAt: it.createdAt }));
    } catch (e) {
      // ignore and fall back to empty
    }
  }
  const res = NextResponse.json({ sessions });
  // Ensure uid cookie
  res.cookies.set(UID_COOKIE, uid, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

export async function POST(req: NextRequest) {
  const uid = getUid();
  const body = await req.json().catch(() => ({}));
  const title = (body && body.title) || 'New chat';
  const id = genId();
  const createdAt = Date.now();
  const item = { uid, id, title, createdAt };
  const ddb = getDdb();
  if (ddb && TABLE_HISTORY) {
    try {
      // Enforce plan-based limit
      const planCookie = cookies().get('selected_plan_v1')?.value as 'free' | 'pro' | 'enterprise' | undefined;
      const plan = planCookie || 'free';
      const limits = { free: 3, pro: 100, enterprise: 1000 } as const;
      const limit = limits[plan];
      const countResp = await ddb.send(new QueryCommand({
        TableName: TABLE_HISTORY,
        KeyConditionExpression: '#u = :u',
        ExpressionAttributeNames: { '#u': 'uid' },
        ExpressionAttributeValues: { ':u': uid },
        Select: 'COUNT',
      }));
      const current = (countResp.Count as number) || 0;
      if (current >= limit) {
        return NextResponse.json({ ok: false, error: `History limit reached for your plan '${plan}'.` }, { status: 403 });
      }
      await ddb.send(new PutCommand({ TableName: TABLE_HISTORY, Item: item }));
    } catch (e) {
      // ignore
    }
  }
  const res = NextResponse.json({ ok: true, session: { id, title, createdAt } });
  res.cookies.set(UID_COOKIE, uid, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

export async function PUT(req: NextRequest) {
  const uid = getUid();
  const body = await req.json().catch(() => ({} as any));
  const { id, title } = body || {};
  if (!id || !title) return NextResponse.json({ ok: false, error: 'Missing id or title' }, { status: 400 });
  const ddb = getDdb();
  if (ddb && TABLE_HISTORY) {
    try {
      await ddb.send(new UpdateCommand({
        TableName: TABLE_HISTORY,
        Key: { uid, id },
        UpdateExpression: 'SET #t = :t',
        ExpressionAttributeNames: { '#t': 'title' },
        ExpressionAttributeValues: { ':t': title },
      }));
    } catch (e) {
      return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 500 });
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(UID_COOKIE, uid, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

export async function DELETE(req: NextRequest) {
  const uid = getUid();
  const body = await req.json().catch(() => ({} as any));
  const { id } = body || {};
  if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
  const ddb = getDdb();
  if (ddb && TABLE_HISTORY) {
    try {
      await ddb.send(new DeleteCommand({ TableName: TABLE_HISTORY, Key: { uid, id } }));
    } catch (e) {
      return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 500 });
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(UID_COOKIE, uid, { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}
