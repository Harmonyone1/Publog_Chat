import Link from 'next/link';

export default function AppSidebar() {
  return (
    <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col p-4 gap-2">
      <div className="text-xl font-bold mb-4">PubLog</div>
      <nav className="flex-1 flex flex-col gap-1">
        <Link href="/chat" className="p-2 rounded hover:bg-slate-800">Chat</Link>
        <Link href="/insights" className="p-2 rounded hover:bg-slate-800">Insights</Link>
        <Link href="/datasets" className="p-2 rounded hover:bg-slate-800">Datasets</Link>
        <Link href="/settings" className="p-2 rounded hover:bg-slate-800">Settings</Link>
        <Link href="/support" className="p-2 rounded hover:bg-slate-800">Support</Link>
      </nav>
      <button className="mt-auto bg-blue-600 text-white rounded px-3 py-2">Upgrade</button>
    </aside>
  );
}
