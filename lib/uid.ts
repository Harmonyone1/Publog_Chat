import { cookies } from 'next/headers';

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

