import { NextResponse } from 'next/server';

type Me = {
  profile: { name: string; email: string };
  preferences: {
    timezone: string;
    currency: string;
    numberFormat: string;
    defaultWindow: string;
  };
};

let me: Me = {
  profile: { name: 'Demo User', email: 'demo@example.com' },
  preferences: {
    timezone: 'UTC',
    currency: 'USD',
    numberFormat: '1,234.56',
    defaultWindow: 'last 12 months',
  },
};

export async function GET() {
  return NextResponse.json(me);
}

export async function PUT(req: Request) {
  try {
    const { profile, preferences } = await req.json();
    if (profile) me.profile = profile;
    if (preferences) me.preferences = preferences;
    return NextResponse.json(me);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
