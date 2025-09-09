'use client';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function UserMenu() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (session?.user && (session.user as any).id) {
      document.cookie = `cognito_sub=${encodeURIComponent((session.user as any).id)}; path=/; SameSite=Lax`;
    }
  }, [session]);

  if (status === 'loading') {
    return <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />;
  }
  if (!session) {
    return (
      <button onClick={() => signIn()} className="text-sm px-3 py-2 border border-slate-700 rounded hover:bg-slate-800">Sign in</button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-300">{session.user?.email || 'Signed in'}</span>
      <button onClick={() => signOut()} className="text-sm px-3 py-2 border border-slate-700 rounded hover:bg-slate-800">Sign out</button>
    </div>
  );
}

