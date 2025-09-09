'use client';
import AppSidebar from './AppSidebar';
import React, { useState } from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PubLog';
  const env = process.env.NEXT_PUBLIC_DATA_CLASSIFICATION || 'Internal';
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 p-2">
            <button className="mb-2 text-xs px-2 py-1 border border-slate-700 rounded hover:bg-slate-800" onClick={() => setOpen(false)}>Close</button>
            <AppSidebar />
          </div>
        </div>
      )}
      <div className="flex flex-col flex-1 min-h-screen">
        {/* Header with mobile menu */}
        <header className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button aria-label="Open menu" className="md:hidden h-8 w-8 rounded bg-slate-800 flex items-center justify-center" onClick={() => setOpen(true)}>
              <span className="sr-only">Open menu</span>
              <div className="h-4 w-4 bg-slate-400" />
            </button>
            <span className="font-semibold" aria-label="Application name">{appName}</span>
            <span className="text-xs text-slate-400 border border-slate-700 rounded px-2 py-0.5" aria-label="Environment">{env}</span>
          </div>
          <button aria-label="User menu" className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
            <span className="sr-only">Open user menu</span>
            <div className="h-6 w-6 rounded-full bg-slate-500" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

