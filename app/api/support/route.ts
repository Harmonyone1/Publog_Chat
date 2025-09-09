import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, message } = await req.json();
    if (!email || !message) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    // Here we would normally persist the request or send an email.
    console.log('Support request', email, message);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
