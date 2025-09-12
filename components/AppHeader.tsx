export default function AppHeader() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Orcha Insights';
  const env = process.env.NEXT_PUBLIC_DATA_CLASSIFICATION || 'Internal';

  return (
    <header className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold" aria-label="Application name">
          {appName}
        </span>
        <span className="text-xs text-slate-400 border border-slate-700 rounded px-2 py-0.5" aria-label="Environment">
          {env}
        </span>
      </div>
      <button
        aria-label="User menu"
        className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="sr-only">Open user menu</span>
        <div className="h-6 w-6 rounded-full bg-slate-500" />
      </button>
    </header>
  );
}
