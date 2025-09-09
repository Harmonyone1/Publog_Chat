import { cookies, headers } from 'next/headers';

export const UID_COOKIE = 'uid_v1';

export function ensureUid(): string {
  const jar = cookies();
  let uid = jar.get(UID_COOKIE)?.value;
  if (!uid) {
    uid = genId();
    // Note: In Next.js App Router, setting cookies from a library isn't straightforward without a Response.
    // API routes should set this cookie on write responses.
  }
  return uid;
}

export function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Prefer authenticated Cognito sub when available, otherwise fall back to anon uid cookie
export function getCurrentUid(): string {
  try {
    const h = headers();
    const sub = h.get('x-cognito-sub') || h.get('x-user-id') || cookies().get('cognito_sub')?.value;
    if (sub) return sub;
  } catch {}
  return ensureUid();
}
