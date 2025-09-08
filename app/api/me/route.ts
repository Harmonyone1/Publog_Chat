import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    profile: { name: 'Demo User', email: 'demo@example.com' },
    preferences: {
      timezone: 'UTC',
      currency: 'USD',
      numberFormat: '1,234.56',
      defaultWindow: 'last 12 months',
    },
  });
}
